import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { CanvasEngine } from "@/lib/studio/engine";
import { replayAction } from "@/lib/studio/engine";
import { cn } from "@/lib/utils";

interface Props {
  engine: CanvasEngine;
  open: boolean;
  onClose: () => void;
}

const SPEEDS = [0.5, 1, 2, 4];

export function ReplayOverlay({ engine, open, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  const stateRef = useRef({ playing, speed, progress });
  stateRef.current = { playing, speed, progress };

  const actions = engine.actions;
  const totalSteps = actions.reduce((sum, a) => sum + Math.max(1, a.points.length), 0) || 1;

  const paint = useCallback(
    (p: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, engine.width, engine.height);
      if (engine.backgroundColor) {
        ctx.fillStyle = engine.backgroundColor;
        ctx.fillRect(0, 0, engine.width, engine.height);
      }
      let target = p * totalSteps;
      for (const action of actions) {
        const cost = Math.max(1, action.points.length);
        if (target <= 0) break;
        const ratio = Math.min(1, target / cost);
        replayAction(ctx, action, engine.width, engine.height, ratio);
        target -= cost;
      }
    },
    [actions, engine.backgroundColor, engine.width, engine.height, totalSteps],
  );

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = engine.width;
    canvas.height = engine.height;
    setProgress(0);
    setPlaying(true);
    paint(0);
  }, [open, engine.width, engine.height, paint]);

  useEffect(() => {
    if (!open) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const s = stateRef.current;
      if (s.playing) {
        const next = Math.min(1, s.progress + (dt * s.speed) / 6);
        setProgress(next);
        paint(next);
        if (next >= 1) setPlaying(false);
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [open, paint]);

  const exportFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "replay-frame.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-label="Drawing replay"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background/95 p-6 backdrop-blur-sm"
        >
          <div className="flex w-full max-w-5xl items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Replay</h2>
              <p className="text-xs text-muted-foreground">
                {actions.length} recorded {actions.length === 1 ? "action" : "actions"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close replay">
              <X className="size-4" />
            </Button>
          </div>

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-h-[62vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)] bg-[length:24px_24px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]"
          >
            {actions.length === 0 ? (
              <div className="grid h-72 place-items-center bg-surface text-sm text-muted-foreground">
                Nothing recorded yet — draw a few strokes and replay them.
              </div>
            ) : (
              <canvas ref={canvasRef} className="block max-h-[62vh] w-full object-contain" />
            )}
          </motion.div>

          <div className="surface-panel flex w-full max-w-5xl items-center gap-3 rounded-2xl px-4 py-3">
            <Button
              size="icon"
              className="rounded-full"
              onClick={() => {
                if (progress >= 1) {
                  setProgress(0);
                  paint(0);
                }
                setPlaying((p) => !p);
              }}
              aria-label={playing ? "Pause replay" : "Play replay"}
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Restart replay"
              onClick={() => {
                setProgress(0);
                paint(0);
                setPlaying(true);
              }}
            >
              <RotateCcw className="size-4" />
            </Button>
            <Slider
              aria-label="Replay progress"
              value={[progress * 100]}
              min={0}
              max={100}
              step={0.5}
              onValueChange={([v]) => {
                const p = (v ?? 0) / 100;
                setPlaying(false);
                setProgress(p);
                paint(p);
              }}
              className="flex-1"
            />
            <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  className={cn(
                    "rounded-lg px-2 py-1 font-mono text-[11px]",
                    speed === s ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {s}×
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={exportFrame}>
              <Download className="size-3.5" /> Frame
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
