"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Package,
  FileText,
  X,
  Download,
  AlertCircle,
} from "lucide-react";
import type { IfcDataStore } from "@ifc-lite/parser";
import {
  collectKeptPhysicalIds,
  collectStripEntityIds,
  downloadPhysicalIfc,
  exportPhysicalOnlyIfc,
  formatSizeKb,
  parseIfcForKeepPhysical,
  type KeepPhysicalProgress,
  type KeepPhysicalResult,
} from "@/lib/keepPhysicalIfc";

type Status = "idle" | "loading" | "ready" | "exporting" | "done" | "error";

export default function KeepPhysicalClient() {
  const [file, setFile] = useState<File | null>(null);
  const [store, setStore] = useState<IfcDataStore | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<KeepPhysicalProgress | null>(null);
  const [result, setResult] = useState<KeepPhysicalResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const strippedCount = store ? collectStripEntityIds(store).size : 0;
  const keptCount = store ? collectKeptPhysicalIds(store).length : 0;

  const loadFile = useCallback(async (incoming: File) => {
    setFile(incoming);
    setStatus("loading");
    setError("");
    setResult(null);
    setProgress({ phase: "parsing", percent: 0, label: "Parsing IFC file…" });

    try {
      const parsed = await parseIfcForKeepPhysical(incoming, setProgress);
      setStore(parsed);
      setStatus("ready");
      setProgress(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load IFC file");
      setStatus("error");
      setStore(null);
    }
  }, []);

  const runExport = useCallback(async () => {
    if (!store || !file) return;

    setStatus("exporting");
    setError("");
    setResult(null);

    try {
      const output = await exportPhysicalOnlyIfc(store, file.name, setProgress);
      setResult(output);
      setStatus("done");
      downloadPhysicalIfc(output.blob, output.filename);
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
        <span className="text-sm font-semibold text-gray-700">Keep Only Physical Elements</span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Strip non-physical elements from your model
              </h1>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Removes IfcSpace, zones, 2D annotations, grids, textures and other
              helper entities — leaving a clean physical-only IFC with intact 3D geometry.
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
                  <p className="text-xs text-gray-400 mt-1">One-click cleanup, no upload to server</p>
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
                    {store
                      ? ` · keep ${keptCount.toLocaleString()} · strip ${strippedCount.toLocaleString()}`
                      : ""}
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
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Keep
                  </p>
                  <p className="text-2xl font-bold text-emerald-800 mt-1">
                    {keptCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">physical elements</p>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                    Strip
                  </p>
                  <p className="text-2xl font-bold text-red-800 mt-1">
                    {strippedCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-red-700 mt-0.5">spaces, grids, 2D, textures</p>
                </div>
              </div>

              <button
                type="button"
                onClick={runExport}
                disabled={status === "exporting" || keptCount === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                {status === "exporting" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Export physical-only IFC
                  </>
                )}
              </button>
            </>
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
                <p className="text-sm font-bold text-emerald-800">Export complete</p>
                <p className="text-xs text-emerald-700 mt-1">
                  {formatSizeKb(result.stats.originalBytes)} →{" "}
                  {formatSizeKb(result.stats.outputBytes)} · stripped{" "}
                  {result.stats.strippedEntities.toLocaleString()} entities
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadPhysicalIfc(result.blob, result.filename)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download {result.filename}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
