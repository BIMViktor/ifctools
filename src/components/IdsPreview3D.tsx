"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, AlertCircle } from "lucide-react";

const FAIL_COLOR: [number, number, number, number] = [1, 0.22, 0.22, 1];

type Props = {
  file: File | null;
  failedIds: number[];
  focusedId: number | null;
};

export default function IdsPreview3D({ file, failedIds, focusedId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<import("@ifc-lite/renderer").Renderer | null>(null);
  const animRef = useRef(0);
  const selectedRef = useRef<Set<number>>(new Set());
  const failedRef = useRef<Set<number>>(new Set());
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noGpu, setNoGpu] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);

  // Keep render-loop refs in sync
  useEffect(() => {
    failedRef.current = new Set(failedIds);
  }, [failedIds]);

  useEffect(() => {
    selectedRef.current = focusedId != null ? new Set([focusedId]) : new Set();
  }, [focusedId]);

  // Init renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;

    (async () => {
      if (!navigator.gpu) {
        setNoGpu(true);
        return;
      }
      try {
        const { Renderer } = await import("@ifc-lite/renderer");
        const renderer = new Renderer(canvasRef.current!);
        await renderer.init();
        if (cancelled) return;
        rendererRef.current = renderer;
        setRendererReady(true);

        const loop = () => {
          const r = rendererRef.current;
          if (r) {
            const failed = failedRef.current;
            r.render({
              selectedIds: selectedRef.current.size > 0 ? selectedRef.current : undefined,
              ghostExceptIds: failed.size > 0 ? failed : null,
              ghostAlpha: 0.14,
              emphasizeOverrides: failed.size > 0,
            });
          }
          animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not start 3D viewer");
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animRef.current);
      rendererRef.current = null;
      setRendererReady(false);
    };
  }, []);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      rendererRef.current?.requestRender();
    });
    obs.observe(canvas.parentElement!);
    return () => obs.disconnect();
  }, []);

  // Load geometry when file + renderer are ready
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !rendererReady || !file || noGpu) return;

    let cancelled = false;
    setLoading(true);
    setReady(false);
    setError("");

    (async () => {
      try {
        await renderer.whenReady();
        const buffer = await file.arrayBuffer();
        const { GeometryProcessor } = await import("@ifc-lite/geometry");
        const gp = new GeometryProcessor();
        await gp.init();

        const meshes: import("@ifc-lite/geometry").MeshData[] = [];
        for await (const event of gp.processAdaptive(new Uint8Array(buffer))) {
          if (cancelled) return;
          if (event.type === "batch") meshes.push(...event.meshes);
        }

        if (cancelled) return;
        renderer.loadGeometry(meshes);
        renderer.fitToView();
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load geometry");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, noGpu, rendererReady]);

  // Apply red overrides whenever failed set or geometry readiness changes
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !ready) return;

    const scene = renderer.getScene();
    const device = renderer.getGPUDevice();
    const pipeline = renderer.getPipeline();
    if (!device || !pipeline) return;

    if (failedIds.length === 0) {
      scene.clearColorOverrides();
      return;
    }

    const overrides = new Map<number, [number, number, number, number]>();
    for (const id of failedIds) overrides.set(id, FAIL_COLOR);
    scene.setColorOverrides(overrides, device, pipeline);
    renderer.requestRender();
  }, [failedIds, ready]);

  // Zoom to focused failure
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !ready || focusedId == null) return;

    const bounds = renderer.getScene().getEntityBoundingBox(focusedId);
    if (!bounds) return;

    void renderer.getCamera().frameBounds(bounds.min, bounds.max, 350);
    renderer.requestRender();
  }, [focusedId, ready]);

  const camRef = useRef({ active: false, panning: false, lx: 0, ly: 0 });

  return (
    <div className="relative w-full h-full min-h-[360px] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ cursor: "grab", touchAction: "none" }}
        onMouseDown={(e) => {
          camRef.current = {
            active: true,
            panning: e.shiftKey || e.button === 1 || e.button === 2,
            lx: e.clientX,
            ly: e.clientY,
          };
        }}
        onMouseMove={(e) => {
          const c = camRef.current;
          const r = rendererRef.current;
          if (!c.active || !r) return;
          const dx = e.clientX - c.lx;
          const dy = e.clientY - c.ly;
          c.lx = e.clientX;
          c.ly = e.clientY;
          const cam = r.getCamera();
          if (c.panning) cam.pan(dx * 0.01, dy * 0.01);
          else cam.orbit(dx * 0.005, dy * 0.005);
          r.requestRender();
        }}
        onMouseUp={() => {
          camRef.current.active = false;
        }}
        onMouseLeave={() => {
          camRef.current.active = false;
        }}
        onWheel={(e) => {
          const r = rendererRef.current;
          const canvas = canvasRef.current;
          if (!r || !canvas) return;
          e.preventDefault();
          const rect = canvas.getBoundingClientRect();
          r.getCamera().zoom(
            e.deltaY * 0.001,
            false,
            e.clientX - rect.left,
            e.clientY - rect.top,
            rect.width,
            rect.height
          );
          r.requestRender();
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

      {noGpu && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div>
            <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">WebGPU not available</p>
            <p className="text-xs text-gray-500 mt-1">
              3D highlight needs a WebGPU browser (Chrome/Edge). Results and BCF export still work.
            </p>
          </div>
        </div>
      )}

      {error && !noGpu && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!file && !noGpu && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-gray-400">3D preview appears after validation</p>
        </div>
      )}

      {ready && (
        <>
          <div className="absolute top-3 left-3 rounded-lg bg-white/90 border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600 shadow-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 align-middle" />
            {failedIds.length.toLocaleString()} failed · ghosted context
          </div>
          <button
            type="button"
            onClick={() => rendererRef.current?.fitToView()}
            className="absolute top-3 right-3 w-7 h-7 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Fit to view"
          >
            <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </>
      )}
    </div>
  );
}
