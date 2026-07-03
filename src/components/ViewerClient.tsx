"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { IfcDataStore } from "@ifc-lite/parser";
import type { SpatialNode } from "@ifc-lite/data";

type LoadStatus = "idle" | "loading" | "ready" | "error" | "no-webgpu";

interface ModelInfo {
  fileName: string;
  entityCount: number;
  schemaVersion: string;
}

interface PropertySet {
  name: string;
  properties: { name: string; value: string | number | boolean | null }[];
}

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
  const [properties, setProperties] = useState<PropertySet[]>([]);
  const [sidePanel, setSidePanel] = useState<"tree" | "props">("tree");

  // Init renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        if (!navigator.gpu) {
          setStatus("no-webgpu");
          return;
        }
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
          setError(e instanceof Error ? e.message : "Could not start viewer");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Resize canvas to fill container
  useEffect(() => {
    if (!canvasRef.current || !rendererRef.current) return;
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

  const loadFile = useCallback(async (file: File) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    setStatus("loading");
    setProgress(5);
    setProgressLabel("Reading file…");
    setSelectedId(null);
    setProperties([]);
    setModelInfo(null);
    setHierarchy(null);

    try {
      const buffer = await file.arrayBuffer();

      setProgress(15);
      setProgressLabel("Parsing IFC…");
      const { IfcParser } = await import("@ifc-lite/parser");
      const parser = new IfcParser();
      const store = await parser.parseColumnar(buffer, {
        onProgress: ({ percent }) => {
          setProgress(15 + Math.round(percent * 0.4));
        },
      });
      storeRef.current = store;

      setProgress(55);
      setProgressLabel("Processing geometry…");
      const { GeometryProcessor } = await import("@ifc-lite/geometry");
      const gp = new GeometryProcessor();
      await gp.init();

      const meshes: import("@ifc-lite/geometry").Mesh[] = [];
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

      setHierarchy(store.spatialHierarchy.project ?? null);
      setProgress(100);
      setProgressLabel("Done");
      setStatus("ready");
      setSidePanel("tree");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not load file");
      setStatus("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = Array.from(e.dataTransfer.files).find((f) =>
        f.name.toLowerCase().endsWith(".ifc")
      );
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
      e.target.value = "";
    },
    [loadFile]
  );

  const handlePick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    const store = storeRef.current;
    if (!renderer || !store || status !== "ready") return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = await renderer.pick(x, y);

    if (hit) {
      setSelectedId(hit.expressId);
      renderer.render({ selectedIds: new Set([hit.expressId]) });

      const { extractPropertiesOnDemand } = await import("@ifc-lite/parser");
      const psets = extractPropertiesOnDemand(store, hit.expressId);
      setProperties(
        psets.map((ps) => ({
          name: ps.name,
          properties: ps.properties.map((p) => ({
            name: p.name,
            value: p.value as string | number | boolean | null,
          })),
        }))
      );
      setSidePanel("props");
    } else {
      setSelectedId(null);
      renderer.render({ selectedIds: new Set() });
      setProperties([]);
    }
  }, [status]);

  // Camera controls
  const cameraRef = useRef({ isDragging: false, isPanning: false, lastX: 0, lastY: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    cameraRef.current = {
      isDragging: true,
      isPanning: e.button === 1 || e.button === 2 || e.shiftKey,
      lastX: e.clientX,
      lastY: e.clientY,
    };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cam = cameraRef.current;
    if (!cam.isDragging || !rendererRef.current) return;
    const dx = e.clientX - cam.lastX;
    const dy = e.clientY - cam.lastY;
    cam.lastX = e.clientX;
    cam.lastY = e.clientY;
    const camera = rendererRef.current.getCamera();
    if (cam.isPanning) camera.pan(dx, dy);
    else camera.orbit(dx, dy);
    rendererRef.current.render();
  }, []);

  const onMouseUp = useCallback(() => {
    cameraRef.current.isDragging = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    renderer.getCamera().zoom(e.deltaY, false, e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    renderer.render();
  }, []);

  const fitView = useCallback(() => {
    rendererRef.current?.fitToView();
  }, []);

  return (
    <div className="flex flex-col h-dvh min-h-0 bg-zinc-950">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors shrink-0">
            ← ifctools<span className="text-indigo-400">.io</span>
          </Link>
          <span className="text-zinc-700 shrink-0">|</span>
          <span className="text-sm font-medium text-white truncate">IFC Viewer</span>
          {modelInfo && (
            <>
              <span className="text-zinc-700 shrink-0">|</span>
              <span className="text-xs text-zinc-500 truncate">
                {modelInfo.fileName} · {modelInfo.entityCount.toLocaleString("en")} entities · {modelInfo.schemaVersion}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status === "ready" && (
            <button
              onClick={fitView}
              title="Fit all"
              className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800 transition-colors"
            >
              Fit all
            </button>
          )}
          <label className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800 transition-colors cursor-pointer">
            {status === "ready" ? "Change model" : "Open IFC"}
            <input type="file" accept=".ifc" className="sr-only" onChange={handleFileInput} />
          </label>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-950">
          {/* Sidebar tab switcher */}
          <div className="flex border-b border-zinc-800">
          {(["tree", "props"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidePanel(tab)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                sidePanel === tab
                  ? "text-white border-b-2 border-indigo-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "tree" ? "Structure" : "Properties"}
              {tab === "props" && selectedId && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px]">
                  #{selectedId}
                </span>
              )}
            </button>
          ))}
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-2">
            {sidePanel === "tree" && hierarchy && (
              <HierarchyTree node={hierarchy} depth={0} />
            )}
            {sidePanel === "tree" && !hierarchy && status === "idle" && (
              <p className="text-xs text-zinc-600 p-3 text-center">
                Load an IFC file to see the model structure
              </p>
            )}
            {sidePanel === "props" && selectedId && properties.length > 0 && (
              <div className="space-y-3">
                {properties.map((ps) => (
                  <div key={ps.name}>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide px-1 mb-1">
                      {ps.name}
                    </p>
                    <div className="rounded-lg border border-zinc-800 overflow-hidden">
                      {ps.properties.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 px-2.5 py-1.5 odd:bg-zinc-900/30 text-xs"
                        >
                          <span className="text-zinc-500 shrink-0 w-32 truncate" title={p.name}>
                            {p.name}
                          </span>
                          <span className="text-zinc-200 flex-1 truncate" title={String(p.value ?? "—")}>
                            {String(p.value ?? "—")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {sidePanel === "props" && !selectedId && (
              <p className="text-xs text-zinc-600 p-3 text-center">
                Click an element in the 3D view to see its properties
              </p>
            )}
          </div>
        </aside>

        {/* Canvas area */}
        <div
          className="relative flex-1 min-w-0"
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

          {/* Idle drop zone overlay */}
          {status === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
              <div
                className={`rounded-2xl border-2 border-dashed px-12 py-10 text-center transition-colors ${
                  isDragging ? "border-indigo-500 bg-indigo-500/5" : "border-zinc-700"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-12 h-12 text-zinc-600 mx-auto mb-3">
                  <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-zinc-300 font-medium text-sm">Drop an IFC file here</p>
                <p className="text-zinc-600 text-xs mt-1">or use the button in the top right</p>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/80">
              <div className="w-64 text-center">
                <p className="text-sm text-zinc-300 mb-3 tabular-nums">{progressLabel}</p>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-2">{progress}%</p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {(status === "error" || status === "no-webgpu") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="max-w-sm text-center px-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                    <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-2">
                  {status === "no-webgpu" ? "WebGPU not supported" : "Could not load model"}
                </p>
                <p className="text-zinc-400 text-sm">
                  {status === "no-webgpu"
                    ? "Your browser does not support WebGPU. Use Chrome 113+, Edge 113+, or Firefox 120+."
                    : error}
                </p>
              </div>
            </div>
          )}

          {/* Drag highlight */}
          {isDragging && status === "ready" && (
            <div className="absolute inset-0 border-2 border-dashed border-indigo-500 bg-indigo-500/5 pointer-events-none rounded" />
          )}
        </div>
      </div>
    </div>
  );
}

function HierarchyTree({ node, depth }: { node: SpatialNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-zinc-800/50 transition-colors text-left"
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {hasChildren ? (
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className={`w-3 h-3 text-zinc-500 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          >
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth={1.5} fill="none" />
          </svg>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="truncate text-zinc-300">{node.name || "(namnlös)"}</span>
        <span className="text-zinc-600 shrink-0">#{node.expressId}</span>
      </button>
      {open && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <HierarchyTree key={child.expressId} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
