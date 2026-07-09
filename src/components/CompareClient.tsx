"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  ArrowLeftRight,
  Play,
  Maximize2,
  Plus,
  Minus,
  MoveRight,
  Equal,
  FileText,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status =
  | "idle"        // nothing loaded yet
  | "ready"       // both files picked, not yet compared
  | "comparing"   // running diff
  | "done"        // results ready
  | "error";

type DiffStatus = "added" | "deleted" | "unchanged";

interface ElementEntry {
  globalId: string;
  expressId?: number;   // exists in file A (for 3D highlight)
  name?: string;
  type?: string;
  status: DiffStatus;
}

interface DiffResult {
  added: ElementEntry[];
  deleted: ElementEntry[];
  unchanged: ElementEntry[];
}

interface PickedFile {
  file: File;
  name: string;
  sizeKb: number;
}

// ─── IFC text GUID extractor ──────────────────────────────────────────────────
// IFC-STEP format: #123= IFCWALL('22charGUID', #site, 'name', ...)
// GlobalId is always a 22-char base64-encoded string (first attribute of IfcRoot).

const IFC_GUID_RE = /#(\d+)\s*=\s*IFC[A-Z]+\('([0-9A-Za-z$_]{22})'/g;

interface GuidMap {
  byGuid: Map<string, number>;       // globalId → expressId
  nameByGuid: Map<string, string>;   // globalId → name (3rd arg)
  typeByGuid: Map<string, string>;   // globalId → IFC type
}

async function extractGuids(file: File): Promise<GuidMap> {
  const text = await file.text();
  const byGuid = new Map<string, number>();
  const nameByGuid = new Map<string, string>();
  const typeByGuid = new Map<string, string>();

  // Extract globalId + expressId
  const re1 = /#(\d+)\s*=\s*(IFC[A-Z]+)\('([0-9A-Za-z$_]{22})'/g;
  let m: RegExpExecArray | null;
  while ((m = re1.exec(text)) !== null) {
    const [, expressId, ifcType, guid] = m;
    byGuid.set(guid, Number(expressId));
    typeByGuid.set(guid, ifcType);
  }

  // Extract names (4th arg, after globalId, ownerHistory, name)
  // Pattern: #id= IFCTYPE('guid', #ref, 'name' or $,
  const re2 = /#\d+\s*=\s*IFC[A-Z]+\('[0-9A-Za-z$_]{22}'\s*,\s*(?:#\d+|\$)\s*,\s*'([^']*)'/g;
  while ((m = re2.exec(text)) !== null) {
    // We need to match this to a guid — re-parse more carefully
  }

  // Simpler: capture guid + name in one pass
  const re3 =
    /#(\d+)\s*=\s*(IFC[A-Z]+)\('([0-9A-Za-z$_]{22})'\s*,\s*(?:#\d+|\$)\s*,\s*(?:'([^']*)'|\$)/g;
  while ((m = re3.exec(text)) !== null) {
    const [, , , guid, name] = m;
    if (name) nameByGuid.set(guid, name);
  }

  return { byGuid, nameByGuid, typeByGuid };
}

function runDiff(mapA: GuidMap, mapB: GuidMap): DiffResult {
  const added: ElementEntry[] = [];
  const deleted: ElementEntry[] = [];
  const unchanged: ElementEntry[] = [];

  // Elements in A: Added (not in B) or Unchanged (in both)
  for (const [guid, expressId] of mapA.byGuid) {
    const name = mapA.nameByGuid.get(guid);
    const type = mapA.typeByGuid.get(guid);
    if (mapB.byGuid.has(guid)) {
      unchanged.push({ globalId: guid, expressId, name, type, status: "unchanged" });
    } else {
      added.push({ globalId: guid, expressId, name, type, status: "added" });
    }
  }

  // Elements in B only: Deleted
  for (const [guid] of mapB.byGuid) {
    if (!mapA.byGuid.has(guid)) {
      const name = mapB.nameByGuid.get(guid);
      const type = mapB.typeByGuid.get(guid);
      deleted.push({ globalId: guid, name, type, status: "deleted" });
    }
  }

  return { added, deleted, unchanged };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const FILTER_META: Record<
  DiffStatus,
  { label: string; color: string; bg: string; border: string; dot: string; icon: React.ElementType }
> = {
  added: {
    label: "Added",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    dot: "bg-emerald-500",
    icon: Plus,
  },
  deleted: {
    label: "Deleted",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-300",
    dot: "bg-red-500",
    icon: Minus,
  },
  unchanged: {
    label: "Unchanged",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-300",
    dot: "bg-gray-400",
    icon: Equal,
  },
};

function FilePicker({
  label,
  file,
  onFile,
  onClear,
}: {
  label: string;
  file: PickedFile | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = Array.from(e.dataTransfer.files).find((x) =>
      x.name.toLowerCase().endsWith(".ifc")
    );
    if (f) onFile(f);
  };

  return (
    <div
      className={`relative flex-1 rounded-2xl border-2 transition-colors ${
        dragging
          ? "border-teal-400 bg-teal-50"
          : file
          ? "border-teal-300 bg-white"
          : "border-dashed border-gray-300 bg-white hover:border-teal-300 hover:bg-gray-50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <label className="flex flex-col items-center justify-center gap-3 py-8 px-6 cursor-pointer text-center h-full">
        {file ? (
          <>
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                {file.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{file.sizeKb} KB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onClear(); }}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">Drop .ifc or click to browse</p>
            </div>
          </>
        )}
        <input
          type="file"
          accept=".ifc"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
        />
      </label>

      {/* Version label */}
      <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {label.split("·")[0].trim()}
      </span>
    </div>
  );
}

function ElementList({ entries, status }: { entries: ElementEntry[]; status: DiffStatus }) {
  const meta = FILTER_META[status];
  const Icon = meta.icon;

  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-2.5 ${meta.bg} border-b border-gray-200`}>
        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
        <span className={`text-xs font-bold ${meta.color}`}>
          {meta.label} — {entries.length.toLocaleString()} elements
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
        {entries.slice(0, 200).map((el) => (
          <div key={el.globalId} className="flex items-center gap-3 px-4 py-1.5 hover:bg-gray-50">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
            <span className="text-xs text-gray-500 font-mono truncate w-24">{el.globalId.slice(0, 8)}…</span>
            <span className="text-xs text-gray-800 font-medium truncate flex-1">
              {el.name || "(unnamed)"}
            </span>
            <span className="text-[10px] text-gray-400 shrink-0">
              {el.type?.replace("Ifc", "") ?? ""}
            </span>
          </div>
        ))}
        {entries.length > 200 && (
          <div className="px-4 py-2 text-xs text-gray-400 text-center">
            + {(entries.length - 200).toLocaleString()} more elements
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Viewer panel ─────────────────────────────────────────────────────────────

function ViewerPanel({
  fileA,
  activeFilters,
  addedIds,
  unchangedIds,
}: {
  fileA: PickedFile | null;
  activeFilters: Set<DiffStatus>;
  addedIds: number[];
  unchangedIds: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<import("@ifc-lite/renderer").Renderer | null>(null);
  const animRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Init renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;
    (async () => {
      if (!navigator.gpu) return;
      const { Renderer } = await import("@ifc-lite/renderer");
      const r = new Renderer(canvasRef.current!);
      await r.init();
      if (cancelled) return;
      rendererRef.current = r;
      const loop = () => { r.render(); animRef.current = requestAnimationFrame(loop); };
      animRef.current = requestAnimationFrame(loop);
    })();
    return () => { cancelled = true; cancelAnimationFrame(animRef.current); };
  }, []);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      rendererRef.current?.render();
    });
    obs.observe(canvas.parentElement!);
    return () => obs.disconnect();
  }, []);

  // Load geometry when fileA changes
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !fileA) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const buf = await fileA.file.arrayBuffer();
      const { GeometryProcessor } = await import("@ifc-lite/geometry");
      const gp = new GeometryProcessor();
      await gp.init();
      const meshes: import("@ifc-lite/geometry").MeshData[] = [];
      for await (const ev of gp.processAdaptive(new Uint8Array(buf))) {
        if (ev.type === "batch") meshes.push(...ev.meshes);
      }
      if (cancelled) return;
      renderer.loadGeometry(meshes);
      renderer.fitToView();
      setLoaded(true);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fileA]);

  // Update highlight when filters change
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !loaded) return;
    const toHighlight = new Set<number>();
    if (activeFilters.has("added")) addedIds.forEach((id) => toHighlight.add(id));
    if (!activeFilters.has("unchanged")) {
      // hide unchanged by selecting only the highlighted set
    }
    renderer.render({ selectedIds: toHighlight.size > 0 ? toHighlight : undefined });
  }, [activeFilters, addedIds, unchangedIds, loaded]);

  const camRef = useRef({ active: false, panning: false, lx: 0, ly: 0 });

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ cursor: "grab", touchAction: "none" }}
        onMouseDown={(e) => {
          camRef.current = { active: true, panning: e.shiftKey || e.button === 1, lx: e.clientX, ly: e.clientY };
        }}
        onMouseMove={(e) => {
          const c = camRef.current;
          if (!c.active || !rendererRef.current) return;
          const dx = e.clientX - c.lx, dy = e.clientY - c.ly;
          c.lx = e.clientX; c.ly = e.clientY;
          const cam = rendererRef.current.getCamera();
          c.panning ? cam.pan(dx, dy) : cam.orbit(dx, dy);
          rendererRef.current.render();
        }}
        onMouseUp={() => { camRef.current.active = false; }}
        onMouseLeave={() => { camRef.current.active = false; }}
        onWheel={(e) => {
          const r = rendererRef.current;
          if (!r) return;
          e.preventDefault();
          const rect = canvasRef.current!.getBoundingClientRect();
          r.getCamera().zoom(e.deltaY, false, e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
          r.render();
        }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading geometry…</p>
          </div>
        </div>
      )}

      {!fileA && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-gray-400">3D preview of file A after comparison</p>
        </div>
      )}

      {loaded && (
        <button
          onClick={() => rendererRef.current?.fitToView()}
          className="absolute top-3 right-3 w-7 h-7 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CompareClient() {
  const [fileA, setFileA] = useState<PickedFile | null>(null);
  const [fileB, setFileB] = useState<PickedFile | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<DiffStatus>>(
    new Set(["added", "deleted", "unchanged"])
  );
  const [showViewer, setShowViewer] = useState(false);

  const pick = useCallback(
    (slot: "a" | "b") => (file: File) => {
      const entry: PickedFile = {
        file,
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
      };
      if (slot === "a") setFileA(entry);
      else setFileB(entry);
      setResult(null);
      setStatus("ready");
    },
    []
  );

  const swap = useCallback(() => {
    setFileA(fileB);
    setFileB(fileA);
    setResult(null);
  }, [fileA, fileB]);

  const runCompare = useCallback(async () => {
    if (!fileA || !fileB) return;
    setStatus("comparing");
    setError("");
    setResult(null);

    try {
      const [mapA, mapB] = await Promise.all([
        extractGuids(fileA.file),
        extractGuids(fileB.file),
      ]);
      const diff = runDiff(mapA, mapB);
      setResult(diff);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed");
      setStatus("error");
    }
  }, [fileA, fileB]);

  const toggleFilter = useCallback((s: DiffStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);

  const canCompare = fileA && fileB && status !== "comparing";
  const addedIds = result?.added.map((e) => e.expressId).filter((x): x is number => x != null) ?? [];
  const unchangedIds = result?.unchanged.map((e) => e.expressId).filter((x): x is number => x != null) ?? [];

  const visibleCategories: DiffStatus[] = ["added", "deleted", "unchanged"];

  return (
    <div className="flex flex-col h-dvh bg-gray-50">

      {/* ── Top bar ── */}
      <header className="shrink-0 h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-bold text-gray-900 flex items-baseline">
            ifc<span className="text-teal-600">2go</span>
          </Link>
          <span className="text-gray-300">·</span>
          <span className="text-sm font-semibold text-gray-700">Compare IFC Files</span>
        </div>
        {result && (
          <button
            onClick={() => setShowViewer((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            {showViewer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showViewer ? "Hide 3D view" : "Show 3D view"}
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

          {/* ── File pickers ── */}
          <div className="flex items-stretch gap-4">
            <FilePicker
              label="A · Newer version"
              file={fileA}
              onFile={pick("a")}
              onClear={() => { setFileA(null); setResult(null); }}
            />

            {/* Swap button */}
            <button
              onClick={swap}
              disabled={!fileA && !fileB}
              className="shrink-0 self-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-30"
              title="Swap A ↔ B"
            >
              <ArrowLeftRight className="w-4 h-4 text-gray-600" />
            </button>

            <FilePicker
              label="B · Older version"
              file={fileB}
              onFile={pick("b")}
              onClear={() => { setFileB(null); setResult(null); }}
            />
          </div>

          {/* ── Run compare ── */}
          <div className="flex items-center gap-4">
            <button
              onClick={runCompare}
              disabled={!canCompare}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-sm"
            >
              {status === "comparing" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Comparing…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Compare
                </>
              )}
            </button>
            {!fileA && !fileB && (
              <p className="text-xs text-gray-400">Load both IFC files to begin</p>
            )}
            {(fileA || fileB) && !(fileA && fileB) && (
              <p className="text-xs text-gray-400">Load the {fileA ? "older" : "newer"} version too</p>
            )}
          </div>

          {/* ── Error ── */}
          {status === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── Results ── */}
          {result && (
            <div className="space-y-5">

              {/* Summary stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {(["added", "deleted", "unchanged"] as DiffStatus[]).map((s) => {
                  const meta = FILTER_META[s];
                  const count = result[s].length;
                  const Icon = meta.icon;
                  return (
                    <div key={s} className={`rounded-2xl border ${meta.border} ${meta.bg} p-4`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className={`text-3xl font-bold ${meta.color}`}>
                        {count.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">elements</p>
                    </div>
                  );
                })}
              </div>

              {/* Filter toggles */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 mr-1">Filter:</span>
                {visibleCategories.map((s) => {
                  const meta = FILTER_META[s];
                  const active = activeFilters.has(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleFilter(s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        active
                          ? `${meta.bg} ${meta.border} ${meta.color}`
                          : "bg-white border-gray-200 text-gray-400"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${active ? meta.dot : "bg-gray-300"}`} />
                      {meta.label}
                      <span className="opacity-60">
                        ({result[s].length.toLocaleString()})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 3D viewer */}
              {showViewer && (
                <div className="h-80 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  <ViewerPanel
                    fileA={fileA}
                    activeFilters={activeFilters}
                    addedIds={addedIds}
                    unchangedIds={unchangedIds}
                  />
                </div>
              )}

              {/* Element lists */}
              <div className="space-y-4">
                {visibleCategories
                  .filter((s) => activeFilters.has(s) && result[s].length > 0)
                  .map((s) => (
                    <ElementList key={s} entries={result[s]} status={s} />
                  ))}
              </div>

              {/* Deleted note */}
              {activeFilters.has("deleted") && result.deleted.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  <MoveRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Deleted elements exist only in file B and cannot be rendered in the 3D view
                    (which shows file A). They are listed above for reference.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
