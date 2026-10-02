"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  ShieldCheck,
  FileText,
  X,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { IDSValidationReport, IDSSpecificationResult, IDSEntityResult } from "@ifc-lite/ids";
import {
  collectFailedExpressIds,
  collectFailureRows,
  downloadBlob,
  exportValidationBcf,
  failuresToCsv,
  getFailedEntities,
  parseIdsFile,
  parseIfcForValidation,
  runIdsValidation,
  type ValidateProgress,
} from "@/lib/validateIds";
import { takePendingIfc } from "@/lib/pendingIfc";
import IdsPreview3D from "@/components/IdsPreview3D";

type Status = "idle" | "ready" | "validating" | "done" | "error";

type ResultFilter = "failed" | "all";

function statusBadge(status: IDSSpecificationResult["status"]) {
  if (status === "pass") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Pass
      </span>
    );
  }
  if (status === "fail") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" />
        Fail
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
      N/A
    </span>
  );
}

function SpecPanel({
  spec,
  defaultOpen,
  focusedId,
  onFocusEntity,
}: {
  spec: IDSSpecificationResult;
  defaultOpen: boolean;
  focusedId: number | null;
  onFocusEntity: (entity: IDSEntityResult) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const failures = getFailedEntities(spec);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{spec.specification.name}</p>
            {statusBadge(spec.status)}
          </div>
          <p className="text-xs text-gray-500">
            {spec.applicableCount.toLocaleString()} applicable ·{" "}
            {spec.passedCount.toLocaleString()} passed ·{" "}
            {spec.failedCount.toLocaleString()} failed · {spec.passRate.toFixed(0)}% pass rate
          </p>
          {spec.specification.description && (
            <p className="text-xs text-gray-400 leading-relaxed">
              {spec.specification.description}
            </p>
          )}
        </div>
      </button>

      {open && failures.length > 0 && (
        <div className="border-t border-gray-100 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-semibold px-4 py-2">Entity</th>
                <th className="text-left font-semibold px-4 py-2">GlobalId</th>
                <th className="text-left font-semibold px-4 py-2">Failure</th>
              </tr>
            </thead>
            <tbody>
              {failures.map((entity) => {
                const messages = entity.requirementResults
                  .filter((req) => req.status === "fail")
                  .map((req) => req.failureReason ?? req.checkedDescription);
                const isFocused = focusedId === entity.expressId;

                return (
                  <tr
                    key={`${entity.expressId}-${entity.globalId}`}
                    onClick={() => onFocusEntity(entity)}
                    className={`border-t border-gray-100 cursor-pointer transition-colors ${
                      isFocused ? "bg-red-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-2 align-top">
                      <p className="font-medium text-gray-900">{entity.entityType}</p>
                      {entity.entityName && (
                        <p className="text-gray-500 mt-0.5">{entity.entityName}</p>
                      )}
                      <p className="text-[10px] text-teal-600 mt-1 font-medium">
                        Show in 3D →
                      </p>
                    </td>
                    <td className="px-4 py-2 align-top font-mono text-gray-600">
                      {entity.globalId ?? "—"}
                    </td>
                    <td className="px-4 py-2 align-top text-gray-700">
                      <ul className="space-y-1">
                        {messages.map((message, index) => (
                          <li key={index}>{message}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && failures.length === 0 && spec.status === "pass" && (
        <div className="border-t border-gray-100 px-4 py-3 text-xs text-emerald-700 bg-emerald-50/50">
          All applicable entities passed this specification.
        </div>
      )}
    </div>
  );
}

export default function IdsValidatorClient() {
  const [ifcFile, setIfcFile] = useState<File | null>(null);
  const [idsFile, setIdsFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ValidateProgress | null>(null);
  const [result, setResult] = useState<IDSValidationReport | null>(null);
  const [filter, setFilter] = useState<ResultFilter>("failed");
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [exportingBcf, setExportingBcf] = useState(false);
  const ifcInputRef = useRef<HTMLInputElement>(null);
  const idsInputRef = useRef<HTMLInputElement>(null);

  const loadIfc = useCallback(
    (incoming: File) => {
      setIfcFile(incoming);
      setResult(null);
      setFocusedId(null);
      setError("");
      setStatus(idsFile ? "ready" : "idle");
    },
    [idsFile]
  );

  const loadIds = useCallback(
    (incoming: File) => {
      setIdsFile(incoming);
      setResult(null);
      setFocusedId(null);
      setError("");
      setStatus(ifcFile ? "ready" : "idle");
    },
    [ifcFile]
  );

  useEffect(() => {
    let cancelled = false;
    void takePendingIfc().then((incoming) => {
      if (!cancelled && incoming) loadIfc(incoming);
    });
    return () => {
      cancelled = true;
    };
  }, [loadIfc]);

  const runValidation = useCallback(async () => {
    if (!ifcFile || !idsFile) return;

    setStatus("validating");
    setError("");
    setResult(null);
    setFocusedId(null);

    try {
      const store = await parseIfcForValidation(ifcFile, setProgress);
      const idsXml = await parseIdsFile(idsFile, setProgress);
      const report = await runIdsValidation(store, idsXml, ifcFile.name, setProgress);
      setResult(report);
      setStatus("done");
      setProgress(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed");
      setStatus("error");
    }
  }, [ifcFile, idsFile]);

  const failureRows = useMemo(
    () => (result ? collectFailureRows(result) : []),
    [result]
  );

  const failedIds = useMemo(
    () => (result ? collectFailedExpressIds(result) : []),
    [result]
  );

  const visibleSpecs = useMemo(() => {
    if (!result) return [];
    if (filter === "all") return result.specificationResults;
    return result.specificationResults.filter((spec) => spec.status === "fail");
  }, [result, filter]);

  const exportBcf = useCallback(async () => {
    if (!result || !ifcFile || failureRows.length === 0) return;

    setExportingBcf(true);
    setError("");

    try {
      const output = await exportValidationBcf(result, ifcFile.name);
      downloadBlob(output.blob, output.filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "BCF export failed");
    } finally {
      setExportingBcf(false);
    }
  }, [result, ifcFile, failureRows.length]);

  const exportCsv = useCallback(() => {
    if (!result || !ifcFile || failureRows.length === 0) return;
    const baseName = ifcFile.name.replace(/\.ifc$/i, "");
    const blob = new Blob([failuresToCsv(failureRows)], {
      type: "text/csv;charset=utf-8",
    });
    downloadBlob(blob, `${baseName}-ids-failures.csv`);
  }, [result, ifcFile, failureRows]);

  const canValidate = Boolean(ifcFile && idsFile && status !== "validating");

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <header className="shrink-0 h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <Link href="/" className="text-sm font-bold text-gray-900 flex items-baseline">
          ifc<span className="text-teal-600">2go</span>
        </Link>
        <span className="text-gray-300">·</span>
        <span className="text-sm font-semibold text-gray-700">IDS Validator</span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Validate IFC against IDS specifications
              </h1>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Check your model against buildingSMART Information Delivery Specifications.
              Failed elements highlight in 3D — click a row to zoom. Export failures as
              BCF 2.1 for Solibri, BIMcollab, Revit and other coordination tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FileDropZone
              label="IFC model"
              hint="Drop a .ifc file"
              accept=".ifc"
              file={ifcFile}
              inputRef={ifcInputRef}
              onPick={loadIfc}
              onClear={() => {
                setIfcFile(null);
                setResult(null);
                setFocusedId(null);
                setStatus("idle");
                setError("");
              }}
            />
            <FileDropZone
              label="IDS specification"
              hint="Drop a .ids XML file"
              accept=".ids,.xml"
              file={idsFile}
              inputRef={idsInputRef}
              onPick={loadIds}
              onClear={() => {
                setIdsFile(null);
                setResult(null);
                setFocusedId(null);
                setStatus("idle");
                setError("");
              }}
            />
          </div>

          {canValidate && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <button
                type="button"
                onClick={runValidation}
                disabled={status === "validating"}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                {status === "validating" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Validating…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Run validation
                  </>
                )}
              </button>
            </div>
          )}

          {progress && status === "validating" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">{progress.label}</span>
                <span className="text-gray-400">{Math.round(progress.percent * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${Math.max(4, progress.percent * 100)}%` }}
                />
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && status === "done" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {result.document.info.title}
                    </p>
                    {result.document.info.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {result.document.info.description}
                      </p>
                    )}
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      result.summary.failedSpecifications === 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {result.summary.overallPassRate.toFixed(0)}%
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <SummaryStat
                    label="Specifications"
                    value={`${result.summary.passedSpecifications}/${result.summary.totalSpecifications} passed`}
                  />
                  <SummaryStat
                    label="Entities checked"
                    value={result.summary.totalEntitiesChecked.toLocaleString()}
                  />
                  <SummaryStat
                    label="Entities failed"
                    value={result.summary.totalEntitiesFailed.toLocaleString()}
                  />
                  <SummaryStat
                    label="Failure rows"
                    value={failureRows.length.toLocaleString()}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={exportBcf}
                    disabled={failureRows.length === 0 || exportingBcf}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
                  >
                    {exportingBcf ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Exporting BCF…
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export BCF 2.1
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={exportCsv}
                    disabled={failureRows.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-800 text-sm font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                {failureRows.length === 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    All specifications passed. No BCF issues to export.
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Failed elements are red in 3D — click a row to zoom. BCF export creates
                    one topic per failing element for Solibri, BIMcollab, Revit or Navisworks.
                  </p>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-4 items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFilter("failed")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        filter === "failed"
                          ? "bg-teal-600 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Failed specs ({result.summary.failedSpecifications})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        filter === "all"
                          ? "bg-teal-600 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      All specs ({result.summary.totalSpecifications})
                    </button>
                  </div>

                  {visibleSpecs.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500 text-center">
                      No failed specifications.
                    </div>
                  ) : (
                    visibleSpecs.map((spec) => (
                      <SpecPanel
                        key={spec.specification.id}
                        spec={spec}
                        defaultOpen={spec.status === "fail"}
                        focusedId={focusedId}
                        onFocusEntity={(entity) => setFocusedId(entity.expressId)}
                      />
                    ))
                  )}
                </div>

                <div className="lg:sticky lg:top-4 h-[420px] lg:h-[min(70vh,640px)]">
                  <IdsPreview3D
                    file={ifcFile}
                    failedIds={failedIds}
                    focusedId={focusedId}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function FileDropZone({
  label,
  hint,
  accept,
  file,
  inputRef,
  onPick,
  onClear,
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const picked = Array.from(e.dataTransfer.files)[0];
        if (picked) onPick(picked);
      }}
      className="rounded-2xl border-2 border-dashed border-gray-300 bg-white"
    >
      {!file ? (
        <label className="flex flex-col items-center justify-center gap-3 py-8 px-6 cursor-pointer text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Upload className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{hint}</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (picked) onPick(picked);
              e.target.value = "";
            }}
          />
        </label>
      ) : (
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {Math.round(file.size / 1024).toLocaleString()} KB
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}
