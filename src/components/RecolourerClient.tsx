"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Palette,
  FileText,
  X,
  Download,
  AlertCircle,
} from "lucide-react";
import type { IfcDataStore } from "@ifc-lite/parser";
import {
  buildRecolourGroups,
  downloadRecolouredIfc,
  exportRecolouredIfc,
  parseIfcForRecolour,
  type ColourGroup,
  type RecolourMode,
  type RecolourProgress,
} from "@/lib/recolourIfc";

type Status = "idle" | "loading" | "ready" | "exporting" | "done" | "error";

const MODES: { id: RecolourMode; label: string; hint: string }[] = [
  {
    id: "discipline",
    label: "By Discipline",
    hint: "Architecture, Structure, MEP, Electrical, Plumbing",
  },
  {
    id: "class",
    label: "By IFC Class",
    hint: "IfcWall, IfcPipeSegment, IfcDoor, etc.",
  },
  {
    id: "system",
    label: "By System",
    hint: "IfcSystem / group assignments from the model",
  },
];

export default function RecolourerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [store, setStore] = useState<IfcDataStore | null>(null);
  const [mode, setMode] = useState<RecolourMode>("discipline");
  const [groups, setGroups] = useState<ColourGroup[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<RecolourProgress | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (incoming: File) => {
    setFile(incoming);
    setStatus("loading");
    setError("");
    setProgress({ phase: "parsing", percent: 0, label: "Parsing IFC file…" });

    try {
      const parsed = await parseIfcForRecolour(incoming, setProgress);
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
    setProgress({ phase: "grouping", percent: 0, label: "Building colour groups…" });
    const next = buildRecolourGroups(store, mode);
    setGroups(next);
    setProgress(null);
  }, [store, status, mode]);

  const updateGroupColor = useCallback((groupId: string, color: string) => {
    setGroups((prev) =>
      prev.map((group) => (group.id === groupId ? { ...group, color } : group))
    );
  }, []);

  const runExport = useCallback(async () => {
    if (!store || !file || groups.length === 0) return;

    setStatus("exporting");
    setError("");

    try {
      const result = await exportRecolouredIfc(
        store,
        groups,
        file.name,
        setProgress
      );
      downloadRecolouredIfc(result.blob, result.filename);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
      setStatus("error");
    }
  }, [store, file, groups]);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <header className="shrink-0 h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <Link href="/" className="text-sm font-bold text-gray-900 flex items-baseline">
          ifc<span className="text-teal-600">2go</span>
        </Link>
        <span className="text-gray-300">·</span>
        <span className="text-sm font-semibold text-gray-700">IFC Recolourer</span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Auto-generate discipline colour profiles
              </h1>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Group elements by IFC class, discipline or system, apply standard RGB
              colours, and export a colour-coded IFC with mutation metadata stamped
              via ifc-lite.
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
                  <p className="text-xs text-gray-400 mt-1">Colours are applied in-browser</p>
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
                    {store ? ` · ${groups.length} colour groups` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setStore(null);
                    setGroups([]);
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
                  Colour profile
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MODES.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 cursor-pointer ${
                        mode === option.id
                          ? "border-teal-300 bg-teal-50"
                          : "border-gray-200 bg-white hover:border-teal-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="recolour-mode"
                        checked={mode === option.id}
                        onChange={() => setMode(option.id)}
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
                  ))}
                </div>
              </div>

              {groups.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {groups.length} colour groups
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Architecture = Silver · Structure = Grey · MEP = Blue · Electrical = Amber
                    </p>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                      >
                        <input
                          type="color"
                          value={group.color}
                          onChange={(e) => updateGroupColor(group.id, e.target.value)}
                          className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {group.label}
                          </p>
                          {group.meta && (
                            <p className="text-xs text-gray-400 mt-0.5">{group.meta}</p>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-500 shrink-0">
                          {group.expressIds.length.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={runExport}
                disabled={status === "exporting" || groups.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                {status === "exporting" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download colour-coded IFC
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
        </div>
      </main>
    </div>
  );
}
