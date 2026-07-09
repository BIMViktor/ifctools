"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Layers,
  ChevronRight,
  Maximize2,
  Upload,
  Box,
} from "lucide-react";
import type { IfcDataStore } from "@ifc-lite/parser";
import type { SpatialNode } from "@ifc-lite/data";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoadStatus = "idle" | "loading" | "ready" | "error" | "no-webgpu";

interface ModelInfo {
  fileName: string;
  entityCount: number;
  schemaVersion: string;
}

interface Pset {
  name: string;
  properties: { name: string; value: string | number | boolean | null }[];
}

// ─── Hierarchy tree ───────────────────────────────────────────────────────────

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: SpatialNode;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.expressId;

  const typeLabel = node.type
    ? String(node.type).replace("Ifc", "").replace(/([A-Z])/g, " $1").trim()
    : null;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setOpen((o) => !o);
          onSelect(node.expressId);
        }}
        className={`w-full flex items-center gap-1.5 py-[5px] pr-2 rounded-md text-left text-xs transition-colors group ${
          isSelected
            ? "bg-teal-50 text-teal-800"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${10 + depth * 14}px` }}
      >
        {/* Chevron */}
        {hasChildren ? (
          <ChevronRight
            className={`w-3 h-3 shrink-0 transition-transform text-gray-400 ${open ? "rotate-90" : ""}`}
          />
        ) : (
          <span className="w-3 shrink-0" />
        )}

        {/* Icon */}
        {depth === 0 && <Layers className="w-3 h-3 shrink-0 text-teal-500" />}
        {depth === 1 && <Box className="w-3 h-3 shrink-0 text-gray-400" />}
        {depth >= 2 && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isSelected ? "bg-teal-500" : "bg-gray-300"
            }`}
          />
        )}

        {/* Label */}
        <span className={`truncate flex-1 ${isSelected ? "font-semibold" : ""}`}>
          {node.name || "(unnamed)"}
        </span>

        {/* Type chip */}
        {typeLabel && (
          <span className="shrink-0 text-[10px] text-gray-400 hidden group-hover:inline">
            {typeLabel}
          </span>
        )}
      </button>

      {open && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.expressId}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Property inspector ───────────────────────────────────────────────────────

function PropertyInspector({
  selectedId,
  psets,
}: {
  selectedId: number | null;
  psets: Pset[];
}) {
  if (!selectedId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 py-12">
        <Box className="w-8 h-8 text-gray-300" strokeWidth={1} />
        <p className="text-xs text-gray-400">
          Click an element in the 3D view or tree to inspect its properties
        </p>
      </div>
    );
  }

  if (psets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <p className="text-xs text-gray-400 text-center">
          No property sets found for #{selectedId}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {psets.map((ps) => (
        <div key={ps.name}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 mb-1.5">
            {ps.name}
          </p>
          <div className="rounded-lg border border-gray-200 overflow-hidden text-xs">
            {ps.properties.map((p, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-3 py-1.5 ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <span
                  className="text-gray-500 shrink-0 w-28 truncate leading-relaxed"
                  title={p.name}
                >
                  {p.name}
                </span>
                <span
                  className="text-gray-900 flex-1 min-w-0 break-words leading-relaxed font-medium"
                  title={String(p.value ?? "—")}
                >
                  {String(p.value ?? "—")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main viewer ──────────────────────────────────────────────────────────────

export default function ViewerClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<import("@ifc-lite/renderer").Renderer | null>(null);
  const storeRef = useRef<IfcDataStore | null>(null);
  const animFrameRef = useRef<number>(0);

  const [status, setStatus] = useState<LoadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [hierarchy, setHierarchy] = useState<SpatialNode | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [psets, setPsets] = useState<Pset[]>([]);

  // ── Renderer init ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        if (!navigator.gpu) { setStatus("no-webgpu"); return; }
        const { Renderer } = await import("@ifc-lite/renderer");
        const renderer = new Renderer(canvasRef.current!);
        await renderer.init();
        if (cancelled) return;
        rendererRef.current = renderer;

        const loop = () => {
          renderer.render();
          animFrameRef.current = requestAnimationFrame(loop);
        };
        animFrameRef.current = requestAnimationFrame(loop);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not start renderer");
          setStatus("error");
        }
      }
    })();

    return () => { cancelled = true; cancelAnimationFrame(animFrameRef.current); };
  }, []);

  // ── Canvas resize ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      rendererRef.current?.render();
    });
    observer.observe(canvas.parentElement!);
    return () => observer.disconnect();
  }, []);

  // ── Select element (shared between 3D pick and tree click) ─────────────────

  const selectElement = useCallback(async (expressId: number) => {
    const store = storeRef.current;
    const renderer = rendererRef.current;
    if (!store) return;

    setSelectedId(expressId);
    renderer?.render({ selectedIds: new Set([expressId]) });

    const { extractPropertiesOnDemand } = await import("@ifc-lite/parser");
    const raw = extractPropertiesOnDemand(store, expressId);
    setPsets(
      raw.map((ps) => ({
        name: ps.name,
        properties: ps.properties.map((p) => ({
          name: p.name,
          value: p.value as string | number | boolean | null,
        })),
      }))
    );
  }, []);

  // ── File loading ───────────────────────────────────────────────────────────

  const loadFile = useCallback(async (file: File) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    setStatus("loading");
    setProgress(5);
    setProgressLabel("Reading file…");
    setSelectedId(null);
    setPsets([]);
    setModelInfo(null);
    setHierarchy(null);

    try {
      const buffer = await file.arrayBuffer();

      setProgress(15);
      setProgressLabel("Parsing IFC…");
      const { IfcParser } = await import("@ifc-lite/parser");
      const parser = new IfcParser();
      const store = await parser.parseColumnar(buffer, {
        onProgress: ({ percent }) => setProgress(15 + Math.round(percent * 0.4)),
      });
      storeRef.current = store;

      setProgress(55);
      setProgressLabel("Processing geometry…");
      const { GeometryProcessor } = await import("@ifc-lite/geometry");
      const gp = new GeometryProcessor();
      await gp.init();

      const meshes: import("@ifc-lite/geometry").MeshData[] = [];
      let batchCount = 0;
      for await (const event of gp.processAdaptive(new Uint8Array(buffer))) {
        if (event.type === "batch") {
          meshes.push(...event.meshes);
          batchCount++;
          setProgress(55 + Math.min(35, batchCount * 3));
        }
      }

      setProgress(90);
      setProgressLabel("Loading into renderer…");
      renderer.loadGeometry(meshes);
      renderer.fitToView();

      setModelInfo({
        fileName: file.name,
        entityCount: store.entityCount,
        schemaVersion: store.schemaVersion ?? "IFC",
      });
      setHierarchy(store.spatialHierarchy?.project ?? null);
      setProgress(100);
      setProgressLabel("Done");
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not load file");
      setStatus("error");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.name.toLowerCase().endsWith(".ifc")
    );
    if (file) loadFile(file);
  }, [loadFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }, [loadFile]);

  // ── 3D click pick ──────────────────────────────────────────────────────────

  const handlePick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    if (!renderer || status !== "ready") return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const hit = await renderer.pick(e.clientX - rect.left, e.clientY - rect.top);

    if (hit) {
      selectElement(hit.expressId);
    } else {
      setSelectedId(null);
      setPsets([]);
      renderer.render({ selectedIds: new Set() });
    }
  }, [status, selectElement]);

  // ── Camera controls ────────────────────────────────────────────────────────

  const camRef = useRef({ active: false, panning: false, lx: 0, ly: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    camRef.current = {
      active: true,
      panning: e.button === 1 || e.button === 2 || e.shiftKey,
      lx: e.clientX,
      ly: e.clientY,
    };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = camRef.current;
    if (!c.active || !rendererRef.current) return;
    const dx = e.clientX - c.lx;
    const dy = e.clientY - c.ly;
    c.lx = e.clientX;
    c.ly = e.clientY;
    const camera = rendererRef.current.getCamera();
    if (c.panning) camera.pan(dx, dy);
    else camera.orbit(dx, dy);
    rendererRef.current.render();
  }, []);

  const onMouseUp = useCallback(() => { camRef.current.active = false; }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    renderer.getCamera().zoom(
      e.deltaY, false,
      e.clientX - rect.left, e.clientY - rect.top,
      rect.width, rect.height
    );
    renderer.render();
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-dvh bg-gray-50">

      {/* ── Top bar ── */}
      <header className="shrink-0 h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="text-sm font-bold text-gray-900 shrink-0 flex items-baseline gap-0"
          >
            ifc<span className="text-teal-600">2go</span>
          </Link>
          <span className="text-gray-300 shrink-0">·</span>
          <span className="text-sm font-semibold text-gray-700 shrink-0">IFC Viewer</span>
          {modelInfo && (
            <span className="text-xs text-gray-400 truncate hidden sm:block">
              — {modelInfo.fileName} · {modelInfo.entityCount.toLocaleString()} entities · {modelInfo.schemaVersion}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status === "ready" && (
            <button
              onClick={() => rendererRef.current?.fitToView()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Fit all
            </button>
          )}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            {status === "ready" ? "Change model" : "Open IFC"}
            <input type="file" accept=".ifc" className="sr-only" onChange={handleFileInput} />
          </label>
        </div>
      </header>

      {/* ── Three-panel body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: Project tree ── */}
        <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Structure
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {hierarchy ? (
              <TreeNode
                node={hierarchy}
                depth={0}
                selectedId={selectedId}
                onSelect={selectElement}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 px-4 py-8 text-center">
                <Layers className="w-7 h-7 text-gray-300" strokeWidth={1} />
                <p className="text-xs text-gray-400">
                  Load an IFC file to see the model structure
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Centre: 3D canvas ── */}
        <div
          className="relative flex-1 min-w-0 bg-gray-100"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ cursor: status === "ready" ? "grab" : "default", touchAction: "none" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onClick={handlePick}
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Idle overlay */}
          {status === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`rounded-2xl border-2 border-dashed px-14 py-10 text-center bg-white/60 backdrop-blur-sm transition-colors ${isDragging ? "border-teal-400" : "border-gray-300"}`}>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" strokeWidth={1} />
                <p className="text-gray-700 font-semibold text-sm">Drop an IFC file here</p>
                <p className="text-gray-400 text-xs mt-1">or use the button above</p>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="w-64 text-center">
                <p className="text-sm text-gray-700 font-medium mb-3">{progressLabel}</p>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">{progress}%</p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {(status === "error" || status === "no-webgpu") && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="max-w-sm text-center px-6">
                <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-500 text-xl">!</span>
                </div>
                <p className="text-gray-900 font-semibold mb-2">
                  {status === "no-webgpu" ? "WebGPU not supported" : "Could not load model"}
                </p>
                <p className="text-gray-500 text-sm">
                  {status === "no-webgpu"
                    ? "Use Chrome 113+, Edge 113+, or enable WebGPU in your browser."
                    : error}
                </p>
              </div>
            </div>
          )}

          {/* Drag-over highlight */}
          {isDragging && status === "ready" && (
            <div className="absolute inset-0 border-2 border-dashed border-teal-400 bg-teal-400/5 pointer-events-none rounded" />
          )}
        </div>

        {/* ── Right: Property inspector ── */}
        <aside className="w-72 shrink-0 border-l border-gray-200 bg-white flex flex-col">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Properties
              </span>
            </div>
            {selectedId && (
              <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5">
                #{selectedId}
              </span>
            )}
          </div>

          <PropertyInspector selectedId={selectedId} psets={psets} />
        </aside>

      </div>
    </div>
  );
}
