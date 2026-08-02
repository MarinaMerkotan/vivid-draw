import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import type { CanvasEngine } from "@/lib/studio/engine";
import type { StrokeStyle, ToolId } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

interface Props {
  engine: CanvasEngine;
  tool: ToolId;
  style: StrokeStyle;
  onColorPicked: (color: string) => void;
  clearPulse: number;
}

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;

export function CanvasStage({ engine, tool, style, onColorPicked, clearPulse }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const drawingRef = useRef(false);
  const panRef = useRef<{ x: number; y: number } | null>(null);
  const spaceRef = useRef(false);
  const stateRef = useRef({ zoom, offset, tool, style });
  stateRef.current = { zoom, offset, tool, style };

  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const pad = wrap.clientWidth < 640 ? 24 : 96;
    const z = Math.min(
      (wrap.clientWidth - pad) / engine.width,
      (wrap.clientHeight - pad) / engine.height,
    );
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
    setZoom(next);
    setOffset({
      x: (wrap.clientWidth - engine.width * next) / 2,
      y: (wrap.clientHeight - engine.height * next) / 2,
    });
  }, [engine]);

  useEffect(() => {
    if (canvasRef.current) engine.attach(canvasRef.current);
    fit();
    const observer = new ResizeObserver(() => fit());
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => {
      observer.disconnect();
      engine.detach();
    };
  }, [engine, fit]);

  /* wheel zoom + pan, non-passive */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom: z, offset: o } = stateRef.current;
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) {
        const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
        if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
          setOffset({ x: o.x - dy, y: o.y });
          return;
        }
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * Math.exp(-dy * 0.0015)));
        const k = next / z;
        setZoom(next);
        setOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceRef.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const toCanvas = (clientX: number, clientY: number, pressure = 0.5) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * engine.width,
      y: ((clientY - rect.top) / rect.height) * engine.height,
      t: performance.now(),
      p: pressure > 0 ? pressure : 0.5,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (tool === "hand" || spaceRef.current || e.button === 1) {
      panRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
      return;
    }
    const pt = toCanvas(e.clientX, e.clientY, e.pressure);
    if (tool === "eyedropper") {
      onColorPicked(engine.pickColor(pt));
      return;
    }
    if (tool === "fill") {
      engine.floodFill(pt, style.color);
      return;
    }
    drawingRef.current = true;
    engine.beginStroke(pt, tool, style);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const wrap = wrapRef.current;
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (panRef.current) {
      setOffset({ x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y });
      return;
    }
    if (!drawingRef.current) return;
    const native = e.nativeEvent;
    const events =
      typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : [native];
    for (const event of events) {
      engine.extendStroke(toCanvas(event.clientX, event.clientY, event.pressure));
    }
  };

  const endPointer = () => {
    panRef.current = null;
    if (drawingRef.current) {
      drawingRef.current = false;
      engine.endStroke();
    }
  };

  const showBrushCursor = tool === "brush" || tool === "eraser";
  const cursorSize = Math.max(6, style.size * zoom);

  return (
    <div
      ref={wrapRef}
      className="dot-grid relative h-full w-full overflow-hidden bg-background"
      onPointerLeave={() => setCursor(null)}
    >
      <div
        className="absolute origin-top-left"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      >
        <motion.div
          animate={{ scale: 1, opacity: 1 }}
          initial={{ scale: 0.96, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="relative rounded-[2px] bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)] bg-[length:24px_24px]"
          style={{
            width: engine.width,
            height: engine.height,
            boxShadow: "0 40px 90px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Drawing canvas"
            className={cn(
              "block touch-none",
              tool === "hand" ? "cursor-grab active:cursor-grabbing" : "cursor-none",
              tool === "eyedropper" && "cursor-crosshair",
            )}
            style={{ width: engine.width, height: engine.height }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onContextMenu={(e) => e.preventDefault()}
          />
          <AnimatePresence>
            {clearPulse > 0 && (
              <motion.div
                key={clearPulse}
                initial={{ opacity: 0.85, scale: 0.2 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-[2px] bg-primary/40"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {showBrushCursor && cursor && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute rounded-full border-2",
            tool === "eraser" ? "border-cyan border-dashed" : "border-foreground/80",
          )}
          style={{
            width: cursorSize,
            height: cursorSize,
            left: cursor.x - cursorSize / 2,
            top: cursor.y - cursorSize / 2,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
          }}
        />
      )}

      <div className="surface-panel absolute right-3 bottom-3 flex items-center gap-0.5 rounded-full px-1 py-0.5 sm:right-4 sm:bottom-4 sm:gap-1 sm:px-1.5 sm:py-1">
        <button
          type="button"
          aria-label="Zoom out"
          className="grid size-8 place-items-center rounded-full hover:bg-surface-2"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.25))}
        >
          <ZoomOut className="size-4" />
        </button>
        <span className="w-10 text-center font-mono text-[10px] text-muted-foreground sm:w-14 sm:text-xs">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          className="grid size-8 place-items-center rounded-full hover:bg-surface-2"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.25))}
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Fit canvas to screen"
          className="grid size-8 place-items-center rounded-full hover:bg-surface-2"
          onClick={fit}
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
