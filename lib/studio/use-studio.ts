import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasEngine } from "./engine";
import { getDrawing, saveDrawing, setLastOpen } from "./storage";
import type { Drawing, StrokeStyle, ToolId } from "./types";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export const DEFAULT_STYLE: StrokeStyle = {
  color: "#FF4D3D",
  size: 14,
  opacity: 1,
  smoothing: 0.35,
  shape: "round",
  shapeMode: "stroke",
  borderWidth: 6,
};

export function useStudio(drawingId: string) {
  const engineRef = useRef<CanvasEngine | null>(null);
  const [engine, setEngine] = useState<CanvasEngine | null>(null);
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [tool, setToolState] = useState<ToolId>("brush");
  const [style, setStyle] = useState<StrokeStyle>(DEFAULT_STYLE);
  const [version, setVersion] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [title, setTitle] = useState("Untitled");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    const record = getDrawing(drawingId);
    if (!record) {
      setStatus("missing");
      return;
    }
    const e = new CanvasEngine(record.width, record.height, record.backgroundColor);
    e.onChange = bump;
    void e.loadLayers(record.layers).then(() => {
      if (cancelled) return;
      e.actions = record.actions ?? [];
      engineRef.current = e;
      setEngine(e);
      setDrawing(record);
      setTitle(record.title);
      setStatus("ready");
      setLastOpen(record.id);
      bump();
    });
    return () => {
      cancelled = true;
      e.detach();
    };
  }, [drawingId, bump]);

  const persist = useCallback(async () => {
    const e = engineRef.current;
    if (!e || !drawing) return;
    setSaveState("saving");
    try {
      const next: Drawing = {
        ...drawing,
        title,
        updatedAt: Date.now(),
        backgroundColor: e.backgroundColor,
        layers: e.serializeLayers(),
        actions: e.actions.slice(-400),
        thumbnail: e.thumbnail(),
      };
      saveDrawing(next);
      setDrawing(next);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [drawing, title]);

  const scheduleSave = useCallback(() => {
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), 1100);
  }, [persist]);

  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    e.onCommit = () => {
      bump();
      scheduleSave();
    };
  }, [engine, scheduleSave, bump]);

  useEffect(() => {
    if (status !== "ready") return;
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  useEffect(() => {
    const flush = () => void persistRef.current();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (timer.current) clearTimeout(timer.current);
      flush();
    };
  }, []);

  const setTool = useCallback((next: ToolId) => setToolState(next), []);
  const patchStyle = useCallback(
    (patch: Partial<StrokeStyle>) => setStyle((s) => ({ ...s, ...patch })),
    [],
  );

  return {
    engine,
    drawing,
    status,
    tool,
    setTool,
    style,
    patchStyle,
    setStyle,
    version,
    bump,
    saveState,
    persist,
    scheduleSave,
    title,
    setTitle,
  };
}
