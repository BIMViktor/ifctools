"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  Download,
  AlertCircle,
} from "lucide-react";
import type { IfcDataStore } from "@ifc-lite/parser";
import {
  downloadPropertyCsv,
  exportPropertyCsv,
  parseIfcForExtract,
  type ExtractProgress,
  type ExtractResult,
} from "@/lib/extractPropertyTable";
import { takePendingIfc } from "@/lib/pendingIfc";

type Status = "idle" | "loading" | "ready" | "exporting" | "done" | "error";

export default function PropertyExtractorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [store, setStore] = useState<IfcDataStore | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ExtractProgress | null>(null);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (incoming: File) => {
    setFile(incoming);
    setStatus("loading");
    setError("");
    setResult(null);
    setProgress({ phase: "parsing", percent: 0, label: "Parsing IFC file…" });

    try {
      const parsed = await parseIfcForExtract(incoming, setProgress);
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
    let cancelled = false;
    void takePendingIfc().then((incoming) => {
      if (!cancelled && incoming) void loadFile(incoming);
    });
    return () => {
      cancelled = true;
    };
  }, [loadFile]);

  const runExport = useCallback(async () => {
    if (!store || !file) return;

    setStatus("exporting");
    setError("");
    setResult(null);

    try {
      const output = await exportPropertyCsv(store, file.name, setProgress);
      setResult(output);
      setStatus("done");
      downloadPropertyCsv(output.blob, output.filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
      setStatus("error");
    }
  }, [store, file]);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <header className="shrink-0 h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <Link href="/" className="text-sm font-bold text-gray-900 flex items-baseline">
          ifc<span className="text-teal-600">2go</span>
        </Link>
        <span className="text-gray-300">·</span>
        <span className="text-sm font-semibold text-gray-700">Property Extractor</span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Export properties and quantities to CSV
              </h1>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Extract every element property set and quantity into a spreadsheet-ready
              CSV file. Opens directly in Excel — processed entirely in your browser.
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
                  <p className="text-sm font-semibold text-gray-700">Drop an .ifc file here</p>
                  <p className="text-xs text-gray-400 mt-1">GlobalId, type, psets and quantities included</p>
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
                  <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
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
                    setResult(null);
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

          {store && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Output format</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                CSV columns: GlobalId, ExpressId, IFCType, Name, SetType, SetName,
                FieldName, Value, Unit. UTF-8 with BOM for Excel compatibility.
              </p>
              <button
                type="button"
                onClick={runExport}
                disabled={status === "exporting"}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                {status === "exporting" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Extracting…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download CSV
                  </>
                )}
              </button>
            </div>
          )}

          {progress && (status === "loading" || status === "exporting") && (
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
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-emerald-800">Extraction complete</p>
                <p className="text-xs text-emerald-700 mt-1">
                  {result.rowCount.toLocaleString()} rows from{" "}
                  {result.elementCount.toLocaleString()} elements · {result.filename}
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadPropertyCsv(result.blob, result.filename)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download again
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
