"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Plus,
  X,
  Combine,
  Download,
  FileText,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import {
  downloadMergedIfc,
  mergeIfcFiles,
  type MergeFileInput,
  type MergeProgress,
  type MergeResult,
} from "@/lib/mergeIfcFiles";

type Status = "idle" | "ready" | "merging" | "done" | "error";

interface SlotFile {
  id: string;
  file: File;
  name: string;
  sizeKb: number;
}

function makeId(): string {
  return crypto.randomUUID();
}

function formatSizeKb(bytes: number): number {
  return Math.max(1, Math.round(bytes / 1024));
}

export default function MergeClient() {
  const [files, setFiles] = useState<SlotFile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<MergeProgress | null>(null);
  const [result, setResult] = useState<MergeResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const appendFiles = useCallback((incoming: File[]) => {
    const ifcFiles = incoming.filter((f) => f.name.toLowerCase().endsWith(".ifc"));
    if (ifcFiles.length === 0) return;

    setFiles((prev) => [
      ...prev,
      ...ifcFiles.map((file) => ({
        id: makeId(),
        file,
        name: file.name,
        sizeKb: formatSizeKb(file.size),
      })),
    ]);
    setResult(null);
    setError("");
    setStatus("ready");
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      return next;
    });
    setResult(null);
    setError("");
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []);
      appendFiles(picked);
      e.target.value = "";
    },
    [appendFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      appendFiles(Array.from(e.dataTransfer.files));
    },
    [appendFiles]
  );

  const runMerge = useCallback(async () => {
    if (files.length < 2) return;

    setStatus("merging");
    setError("");
    setResult(null);
    setProgress({
      phase: "parsing",
      percent: 0,
      label: "Starting merge…",
      fileCount: files.length,
      fileIndex: 1,
    });

    try {
      const inputs: MergeFileInput[] = files.map((slot) => ({
        id: slot.id,
        file: slot.file,
        name: slot.name,
      }));

      const merged = await mergeIfcFiles(inputs, setProgress);
      setResult(merged);
      setStatus("done");
      downloadMergedIfc(merged.blob, merged.filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Merge failed");
      setStatus("error");
    }
  }, [files]);

  const canMerge = files.length >= 2 && status !== "merging";
  const fileCount = files.length;

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <header className="shrink-0 h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <Link href="/" className="text-sm font-bold text-gray-900 flex items-baseline">
          ifc<span className="text-teal-600">2go</span>
        </Link>
        <span className="text-gray-300">·</span>
        <span className="text-sm font-semibold text-gray-700">Merge IFC</span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Combine className="w-5 h-5 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Combine discipline models into one federated IFC
              </h1>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Upload Arch, Structure, MEP or any independent IFC files. ifc-lite
              stitches element headers, geometry definitions and property sets into
              a single consolidated model — processed entirely in your browser.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-gray-700">
              {fileCount === 0
                ? "No files selected"
                : `${fileCount} of ${fileCount} file${fileCount === 1 ? "" : "s"} selected`}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add IFC file
            </button>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-5 space-y-3"
          >
            {files.length === 0 ? (
              <label className="flex flex-col items-center justify-center gap-3 py-10 cursor-pointer text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Drop multiple .ifc files here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Arch + Structure + MEP — order matters: first file is the base model
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".ifc"
                  multiple
                  className="sr-only"
                  onChange={handleInputChange}
                />
              </label>
            ) : (
              <>
                {files.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                    <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {slot.name}
                        </p>
                        {index === 0 && (
                          <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                            Base
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {slot.sizeKb.toLocaleString()} KB
                        {index > 0 ? ` · Model ${index + 1}` : " · Primary model"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(slot.id)}
                      className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center transition-colors"
                      aria-label={`Remove ${slot.name}`}
                    >
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                ))}

                <label className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-200 text-xs font-semibold text-gray-500 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50/40 cursor-pointer transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Append another IFC file
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".ifc"
                    multiple
                    className="sr-only"
                    onChange={handleInputChange}
                  />
                </label>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={runMerge}
              disabled={!canMerge}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-sm"
            >
              {status === "merging" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Merging…
                </>
              ) : (
                <>
                  <Combine className="w-4 h-4" />
                  Merge &amp; Download
                </>
              )}
            </button>
            {fileCount < 2 && (
              <p className="text-xs text-gray-400">Add at least two IFC files to merge</p>
            )}
          </div>

          {status === "merging" && progress && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-gray-700">{progress.label}</span>
                <span className="text-gray-400">
                  {Math.round(progress.percent * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${Math.max(4, progress.percent * 100)}%` }}
                />
              </div>
              {progress.fileCount && progress.fileIndex && progress.phase === "parsing" && (
                <p className="text-xs text-gray-400">
                  File {progress.fileIndex} of {progress.fileCount}
                  {progress.currentModel ? ` · ${progress.currentModel}` : ""}
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

          {result && status === "done" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-emerald-800">Merge complete</p>
                <p className="text-xs text-emerald-700 mt-1">
                  {result.stats.modelCount} models combined into{" "}
                  {result.stats.totalEntityCount.toLocaleString()} entities ·{" "}
                  {Math.round(result.stats.fileSize / 1024).toLocaleString()} KB
                </p>
              </div>

              {result.stats.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-1">
                  {result.stats.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => downloadMergedIfc(result.blob, result.filename)}
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
