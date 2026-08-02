"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { SlidersHorizontal, Trash2, X } from "lucide-react";
import { TopBar } from "@/components/studio/top-bar";
import { ToolsPanel } from "@/components/studio/tools-panel";
import { PropertiesPanel } from "@/components/studio/properties-panel";
import { CanvasStage } from "@/components/studio/canvas-stage";
import { ReplayOverlay } from "@/components/studio/replay-overlay";
import { useStudio } from "@/lib/studio/use-studio";
import { TOOL_BY_KEY } from "@/lib/studio/tools";
import { Button } from "@/components/ui/button";

export default function Workspace() {
  const { drawingId } = useParams<{ drawingId: string }>();
  const router = useRouter();
  const studio = useStudio(drawingId);
  const { engine, tool, setTool, style, patchStyle, version, saveState, title, setTitle } = studio;
  const [recent, setRecent] = useState<string[]>([]);
  const [savedColors, setSavedColors] = useState<string[]>([]);
  const [replayOpen, setReplayOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [clearPulse, setClearPulse] = useState(0);
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false);
  const lastColor = useRef(style.color);

  useEffect(() => {
    if (style.color !== lastColor.current) {
      lastColor.current = style.color;
      setRecent((r) => [style.color, ...r.filter((c) => c !== style.color)].slice(0, 12));
    }
  }, [style.color]);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.isContentEditable) return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) engine?.redo();
        else engine?.undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        engine?.redo();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && engine?.selection) {
        e.preventDefault();
        engine.clearSelectionArea();
        return;
      }
      if (e.key === "[") patchStyle({ size: Math.max(1, style.size - 2) });
      if (e.key === "]") patchStyle({ size: Math.min(160, style.size + 2) });
      const mapped = TOOL_BY_KEY[e.key.toLowerCase()];
      if (mapped && !meta) setTool(mapped);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine, setTool, patchStyle, style.size]);

  const canUndo = useMemo(() => !!engine?.canUndo, [engine, version]);
  const canRedo = useMemo(() => !!engine?.canRedo, [engine, version]);

  if (studio.status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
          className="size-8 rounded-full border-2 border-primary border-t-transparent"
          aria-label="Loading canvas"
        />
      </div>
    );
  }

  if (studio.status === "missing" || !engine) {
    return (
      <div className="grid min-h-screen place-items-center gap-4 bg-background px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">This canvas is gone</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The drawing you're looking for was deleted or never existed.
          </p>
          <Button className="mt-5" onClick={() => router.push("/")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleExport = async (type: "image/png" | "image/webp") => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 420));
    const url = engine.toDataURL(type);
    const link = document.createElement("a");
    link.download = `${title || "drawing"}.${type === "image/png" ? "png" : "webp"}`;
    link.href = url;
    link.click();
    setExporting(false);
    setExported(true);
    toast.success(`Exported as ${type === "image/png" ? "PNG" : "WebP"}`);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <TopBar
        title={title}
        onTitleChange={setTitle}
        saveState={saveState}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => {
          engine.undo();
          toast("Undone", { duration: 900 });
        }}
        onRedo={() => {
          engine.redo();
          toast("Redone", { duration: 900 });
        }}
        onClear={() => {
          engine.clearAll();
          setClearPulse((p) => p + 1);
        }}
        onExport={(t) => void handleExport(t)}
        onReplay={() => setReplayOpen(true)}
        exporting={exporting}
        exported={exported}
      />

      <div className="relative flex min-h-0 flex-1">
        <motion.div
          initial={{ x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="absolute top-4 left-3 z-20 hidden md:block"
        >
          <ToolsPanel tool={tool} onChange={setTool} />
        </motion.div>

        <div className="min-w-0 flex-1">
          <CanvasStage
            engine={engine}
            tool={tool}
            style={style}
            onColorPicked={(c) => {
              patchStyle({ color: c });
              toast(`Picked ${c.toUpperCase()}`, { duration: 900 });
            }}
            clearPulse={clearPulse}
          />
        </div>

        <button
          type="button"
          onClick={() => setMobilePropertiesOpen(true)}
          className="surface-panel absolute bottom-3 left-3 z-20 flex h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold md:hidden"
          aria-label="Open color and tool settings"
        >
          <SlidersHorizontal className="size-4 text-primary" /> Style
        </button>

        <motion.aside
          initial={{ x: 16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="hidden w-[300px] shrink-0 border-l border-border bg-surface/70 backdrop-blur lg:block"
          aria-label="Tool properties"
        >
          <PropertiesPanel
            engine={engine}
            tool={tool}
            style={style}
            patchStyle={patchStyle}
            recent={recent}
            saved={savedColors}
            onSaveColor={(c) => {
              setSavedColors((s) => (s.includes(c) ? s : [c, ...s].slice(0, 12)));
              toast.success("Color saved to palette");
            }}
            onChange={() => {
              studio.bump();
              studio.scheduleSave();
            }}
          />
        </motion.aside>
      </div>

      {/* mobile tools */}
      <div className="border-t border-border bg-surface/90 p-1.5 md:hidden">
        <ToolsPanel tool={tool} onChange={setTool} orientation="horizontal" />
      </div>

      <footer className="flex h-7 shrink-0 items-center gap-3 overflow-hidden border-t border-border bg-surface px-3 font-mono text-[10px] text-muted-foreground sm:h-8 sm:gap-4 sm:px-4 sm:text-[11px]">
        <span className="shrink-0">
          {engine.width} × {engine.height}
        </span>
        <span className="shrink-0">{engine.layers.length} layers</span>
        <span className="hidden shrink-0 sm:inline">{engine.actions.length} strokes</span>
        {engine.selection && (
          <span className="flex items-center gap-1 text-cyan">
            <Trash2 className="size-3" /> selection active — press Delete
          </span>
        )}
        <span className="ml-auto shrink-0">{saveState === "saving" ? "autosaving…" : "autosave on"}</span>
      </footer>

      <AnimatePresence>
        {mobilePropertiesOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close tool settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobilePropertiesOpen(false)}
              className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] md:hidden"
            />
            <motion.aside
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-50 flex h-[82dvh] flex-col overflow-hidden rounded-t-[28px] border border-border bg-surface shadow-[0_-30px_80px_-30px_rgba(0,0,0,0.9)] md:hidden"
              aria-label="Tool properties"
            >
              <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
                <div>
                  <p className="font-display text-sm font-semibold">Style & canvas</p>
                  <p className="text-[10px] text-muted-foreground">Color, brush, background and layers</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobilePropertiesOpen(false)}
                  className="ml-auto grid size-9 place-items-center rounded-xl bg-surface-2 text-muted-foreground hover:text-foreground"
                  aria-label="Close tool settings"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">
                <PropertiesPanel
                  engine={engine}
                  tool={tool}
                  style={style}
                  patchStyle={patchStyle}
                  recent={recent}
                  saved={savedColors}
                  onSaveColor={(c) => {
                    setSavedColors((s) => (s.includes(c) ? s : [c, ...s].slice(0, 12)));
                    toast.success("Color saved to palette");
                  }}
                  onChange={() => {
                    studio.bump();
                    studio.scheduleSave();
                  }}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ReplayOverlay engine={engine} open={replayOpen} onClose={() => setReplayOpen(false)} />
    </div>
  );
}
