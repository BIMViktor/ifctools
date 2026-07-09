"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Scissors,
  FileText,
  X,
  Download,
  AlertCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import type { IfcDataStore } from "@ifc-lite/parser";
import {
  discoverPropertyFields,
  discoverSplitKeys,
  downloadAllSplitOutputs,
  downloadSplitIfc,
  parseIfcForSplit,
  runSplitExports,
  type PropertyField,
  type SplitKey,
  type SplitMode,
  type SplitOutput,
  type SplitProgress,
} from "@/lib/splitIfcFiles";

type Status = "idle" | "loading" | "ready" | "splitting" | "done" | "error";

const SPLIT_MODES: { id: SplitMode; label: string; hint: string }[] = [
  {
    id: "storey",
    label: "By Storey",
    hint: "Split by IfcBuildingStorey, e.g. Level 0, Level 1",
  },
  {
    id: "building",
    label: "By Building",
    hint: "Split by IfcBuilding containers",
  },
  {
    id: "class",
    label: "By Class",
    hint: "Split by IFC class, e.g. Wall, Door, Slab",
  },
  {
    id: "property",
    label: "By Property",
    hint: "Split by a property value, e.g. FireRating or IsExternal",
  },
];

export default function SplitClient() {
  const [file, setFile] = useState<File | null>(null);
  const [store, setStore] = useState<IfcDataStore | null>(null);
  const [mode, setMode] = useState<SplitMode>("storey");
  const [keys, setKeys] = useState<SplitKey[]>([]);
  const [propertyFields, setPropertyFields] = useState<PropertyField[]>([]);
  const [selectedPropertyField, setSelectedPropertyField] =
    useState<PropertyField | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<SplitProgress | null>(null);
  const [outputs, setOutputs] = useState<SplitOutput[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (incoming: File) => {
    setFile(incoming);
    setStatus("loading");
    setError("");
    setOutputs([]);
    setKeys([]);
    setPropertyFields([]);
    setSelectedPropertyField(null);
    setCheckedIds(new Set());
    setProgress({
      phase: "parsing",
      percent: 0,
      label: "Parsing IFC file…",
    });

    try {
      const parsed = await parseIfcForSplit(incoming, setProgress);
      setStore(parsed);
      setStatus("ready");
      setProgress(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load IFC file");
      setStatus("error");
      setStore(null);
    }
  }, []);

  useEffect(() => {
    if (!store || status !== "ready") return;

    let cancelled = false;

    (async () => {
      try {
        if (mode === "property" && propertyFields.length === 0) {
          setProgress({
            phase: "discovering",
            percent: 0,
            label: "Scanning property fields…",
          });
          const fields = await discoverPropertyFields(store, setProgress);
          if (cancelled) return;
          setPropertyFields(fields);
          setSelectedPropertyField(fields[0] ?? null);
          setProgress(null);
          return;
        }

        if (mode === "property" && !selectedPropertyField) {
          setKeys([]);
          setCheckedIds(new Set());
          return;
        }

        setProgress({
          phase: "discovering",
          percent: 0,
          label: "Discovering split targets…",
        });

        const discovered = await discoverSplitKeys(
          store,
          mode,
          selectedPropertyField,
          setProgress
        );

        if (cancelled) return;
        setKeys(discovered);
        setCheckedIds(new Set(discovered.map((key) => key.id)));
        setProgress(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not discover split keys");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [store, status, mode, selectedPropertyField, propertyFields.length]);

  const toggleKey = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setOutputs([]);
  }, []);

  const toggleAll = useCallback(() => {
    setCheckedIds((prev) => {
      if (prev.size === keys.length) return new Set();
      return new Set(keys.map((key) => key.id));
    });
    setOutputs([]);
  }, [keys]);

  const runSplit = useCallback(async () => {
    if (!store || !file) return;

    const selected = keys.filter((key) => checkedIds.has(key.id));
    if (selected.length === 0) return;

    setStatus("splitting");
    setError("");
    setOutputs([]);
    setProgress({
      phase: "exporting",
      percent: 0,
      label: "Starting split export…",
      keyCount: selected.length,
      keyIndex: 1,
    });

    try {
      const results = await runSplitExports(
        store,
        selected,
        file.name,
        setProgress
      );
      setOutputs(results);
      setStatus("done");
      downloadAllSplitOutputs(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Split export failed");
      setStatus("error");
    }
  }, [store, file, keys, checkedIds]);

  const canSplit =
    status === "ready" && checkedIds.size > 0 && keys.length > 0;
  const allChecked = keys.length > 0 && checkedIds.size === keys.length;

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <header className="shrink-0 h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <Link href="/" className="text-sm font-bold text-gray-900 flex items-baseline">
          ifc<span className="text-teal-600">2go</span>
        </Link>
        <span className="text-gray-300">·</span>
        <span className="text-sm font-semibold text-gray-700">Split IFC</span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Segment a model into separate IFC files
              </h1>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Load one IFC model, choose a split mode, select the targets you
              want, and ifc-lite exports isolated files with only the matching
              elements and their references kept intact.
            </p>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const picked = Array.from(e.dataTransfer.files).find((f) =>
                f.name.toLowerCase().endsWith(".ifc")
              );
              if (picked) loadFile(picked);
            }}
            className="rounded-2xl border-2 border-dashed border-gray-300 bg-white"
          >
            {!file ? (
              <label className="flex flex-col items-center justify-center gap-3 py-10 px-6 cursor-pointer text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Drop an .ifc file here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Or click to browse your federated model
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".ifc"
                  className="sr-only"
                  onChange={(e) => {
                    const picked = e.target.files?.[0];
                    if (picked) loadFile(picked);
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
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Math.round(file.size / 1024).toLocaleString()} KB
                    {store ? ` · ${store.entityCount.toLocaleString()} entities` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setStore(null);
                    setKeys([]);
                    setOutputs([]);
                    setPropertyFields([]);
                    setSelectedPropertyField(null);
                    setCheckedIds(new Set());
                    setStatus("idle");
                    setError("");
                  }}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>

          {status === "loading" && progress && (
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

          {store && status !== "loading" && (
            <>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Split mode
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SPLIT_MODES.map((option) => {
                    const active = mode === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors ${
                          active
                            ? "border-teal-300 bg-teal-50"
                            : "border-gray-200 bg-white hover:border-teal-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="split-mode"
                          checked={active}
                          onChange={() => {
                            setMode(option.id);
                            setOutputs([]);
                            if (option.id !== "property") {
                              setSelectedPropertyField(null);
                            }
                          }}
                          className="mt-1 accent-teal-600"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-gray-900">
                            {option.label}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5">
                            {option.hint}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {mode === "property" && propertyFields.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Property field
                  </label>
                  <select
                    value={selectedPropertyField?.id ?? ""}
                    onChange={(e) => {
                      const field =
                        propertyFields.find((item) => item.id === e.target.value) ??
                        null;
                      setSelectedPropertyField(field);
                      setOutputs([]);
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  >
                    {propertyFields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label} ({field.valueCount} values)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {keys.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {checkedIds.size} of {keys.length} selected
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Choose which segments to export as separate IFC files
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                    >
                      {allChecked ? "Clear all" : "Select all"}
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {keys.map((key) => {
                      const checked = checkedIds.has(key.id);
                      return (
                        <label
                          key={key.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <span className="shrink-0 text-teal-600">
                            {checked ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300" />
                            )}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleKey(key.id)}
                            className="sr-only"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {key.label}
                            </p>
                            {key.meta && (
                              <p className="text-xs text-gray-400 mt-0.5">{key.meta}</p>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-500 shrink-0">
                            {key.elementCount.toLocaleString()} elements
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {keys.length === 0 && progress?.phase === "discovering" && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
                  {progress.label}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={runSplit}
                  disabled={!canSplit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  {status === "splitting" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Splitting…
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      Run Split
                    </>
                  )}
                </button>
                {keys.length === 0 && (
                  <p className="text-xs text-gray-400">
                    No split targets found for this mode
                  </p>
                )}
              </div>
            </>
          )}

          {status === "splitting" && progress && (
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
              {progress.keyIndex && progress.keyCount && (
                <p className="text-xs text-gray-400">
                  File {progress.keyIndex} of {progress.keyCount}
                  {progress.currentKey ? ` · ${progress.currentKey}` : ""}
                </p>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {outputs.length > 0 && status === "done" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-emerald-800">
                  Split complete — {outputs.length} file{outputs.length === 1 ? "" : "s"} created
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Each download contains only the selected segment plus its required references.
                </p>
              </div>

              <div className="space-y-2">
                {outputs.map((output) => (
                  <div
                    key={output.key.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {output.filename}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {output.key.label} · {output.stats.entityCount.toLocaleString()} entities ·{" "}
                        {Math.round(output.stats.fileSize / 1024).toLocaleString()} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadSplitIfc(output.blob, output.filename)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => downloadAllSplitOutputs(outputs)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download all again
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
