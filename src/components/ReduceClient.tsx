"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Minimize2,
  FileText,
  X,
  Download,
  AlertCircle,
} from "lucide-react";
import type { IfcDataStore } from "@ifc-lite/parser";
import {
  downloadReducedIfc,
  formatSavings,
  parseIfcForReduce,
  reduceIfcFile,
  type ReduceLevel,
  type ReduceProgress,
  type ReduceResult,
} from "@/lib/reduceIfcFile";

type Status = "idle" | "loading" | "ready" | "optimizing" | "done" | "error";

const LEVELS: {
  id: ReduceLevel;
  label: string;
  hint: string;
  savings: string;
}[] = [
  {
    id: "light",
    label: "Light",
    hint: "Purge empty property sets, duplicate owner histories and unused metadata.",
    savings: "~10–20%",
  },
  {
    id: "medium",
    label: "Medium",
    hint: "Strip IfcSpace, grids, 2D annotations, textures and non-physical helpers.",
    savings: "~25–40%",
  },
  {
    id: "aggressive",
    label: "Aggressive",
    hint: "Medium cleanup plus lowest tessellation mesh simplification for heavy geometry.",
    savings: "~40–70%",
  },
];

export default function ReduceClient() {
  const [file, setFile] = useState<File | null>(null);
  const [store, setStore] = useState<IfcDataStore | null>(null);
  const [level, setLevel] = useState<ReduceLevel>("medium");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ReduceProgress | null>(null);
  const [result, setResult] = useState<ReduceResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (incoming: File) => {
    setFile(incoming);
    setStatus("loading");
    setError("");
    setResult(null);
    setProgress({ phase: "parsing", percent: 0, label: "Parsing IFC file…" });

    try {
      const parsed = await parseIfcForReduce(incoming, setProgress);
      setStore(parsed);
      setStatus("ready");
      setProgress(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load IFC file");
      setStatus("error");
      setStore(null);
    }
  }, []);

  const runOptimize = useCallback(async () => {
    if (!store || !file) return;

    setStatus("optimizing");
    setError("");
    setResult(null);
    setProgress({ phase: "analyzing", percent: 0, label: "Starting optimization…" });

    try {
      const output = await reduceIfcFile(store, level, file.name, setProgress);
      setResult(output);
      setStatus("done");
      downloadReducedIfc(output.blob, output.filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimization failed");
      setStatus("error");
    }
  }, [store, file, level]);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <header className="shrink-0 h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <Link href="/" className="text-sm font-bold text-gray-900 flex items-baseline">
          ifc<span className="text-teal-600">2go</span>
        </Link>
        <span className="text-gray-300">·</span>
        <span className="text-sm font-semibold text-gray-700">Reduce IFC File Size</span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Minimize2 className="w-5 h-5 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-900">
                One-click IFC asset optimizer
              </h1>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Choose a cleanup strength. ifc-lite purges metadata, strips non-physical
              entities, and optionally re-tessellates geometry at lower detail — all
              in your browser.
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
                  <p className="text-xs text-gray-400 mt-1">Original file is never uploaded to a server</p>
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
            <>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Optimization strength
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {LEVELS.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-4 cursor-pointer ${
                        level === option.id
                          ? "border-teal-300 bg-teal-50"
                          : "border-gray-200 bg-white hover:border-teal-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reduce-level"
                        checked={level === option.id}
                        onChange={() => {
                          setLevel(option.id);
                          setResult(null);
                        }}
                        className="mt-1 accent-teal-600"
                      />
                      <span className="flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {option.label}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                            {option.savings}
                          </span>
                        </span>
                        <span className="block text-xs text-gray-500 mt-1 leading-relaxed">
                          {option.hint}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={runOptimize}
                disabled={status === "optimizing"}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                {status === "optimizing" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Optimizing…
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    Run Optimize
                  </>
                )}
              </button>
            </>
          )}

          {progress && (status === "loading" || status === "optimizing") && (
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
                <p className="text-sm font-bold text-emerald-800">Optimization complete</p>
                <p className="text-xs text-emerald-700 mt-1">
                  {Math.round(result.stats.originalBytes / 1024).toLocaleString()} KB →{" "}
                  {Math.round(result.stats.outputBytes / 1024).toLocaleString()} KB · saved{" "}
                  {formatSavings(result.stats)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-emerald-800">
                <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
                  Hidden entities: {result.stats.hiddenEntities.toLocaleString()}
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
                  Purged Psets: {result.stats.purgedPropertySets.toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => downloadReducedIfc(result.blob, result.filename)}
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
