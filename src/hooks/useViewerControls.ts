import { useEffect, type RefObject } from "react";
import type { Renderer } from "@ifc-lite/renderer";

/** Orbit / pan / zoom on the IFC canvas. */
export function useViewerControls(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  rendererRef: RefObject<Renderer | null>,
  active: boolean
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!active || !canvas || !renderer) return;

    const camera = renderer.getCamera();
    let dragging = false;
    let button = 0;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      button = e.button;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (button === 2 || (button === 0 && e.shiftKey)) {
        camera.pan(dx * 0.01, dy * 0.01);
      } else {
        camera.orbit(dx * 0.005, dy * 0.005);
      }
      renderer.requestRender();
    };

    const endDrag = (e: PointerEvent) => {
      dragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      camera.zoom(
        e.deltaY * 0.001,
        false,
        e.clientX - rect.left,
        e.clientY - rect.top,
        rect.width,
        rect.height
      );
      renderer.requestRender();
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [active, canvasRef, rendererRef]);
}
