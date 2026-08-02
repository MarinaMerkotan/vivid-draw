import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ColorStudio } from "./color-studio";
import { LayersPanel } from "./layers-panel";
import { SHAPE_TOOLS, TOOLS } from "@/lib/studio/tools";
import { SWATCHES, isValidHex, normalizeHex } from "@/lib/studio/palettes";
import type { CanvasEngine } from "@/lib/studio/engine";
import type { BrushShape, ShapeMode, StrokeStyle, ToolId } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

interface Props {
  engine: CanvasEngine;
  tool: ToolId;
  style: StrokeStyle;
  patchStyle: (patch: Partial<StrokeStyle>) => void;
  recent: string[];
  saved: string[];
  onSaveColor: (c: string) => void;
  onChange: () => void;
}

export function PropertiesPanel({
  engine,
  tool,
  style,
  patchStyle,
  recent,
  saved,
  onSaveColor,
  onChange,
}: Props) {
  const def = TOOLS.find((t) => t.id === tool)!;
  const isShape = SHAPE_TOOLS.includes(tool);
  const usesColor = tool !== "eraser" && tool !== "hand" && tool !== "select";
  const usesSize = tool === "brush" || tool === "eraser" || tool === "line";
  const usesOpacity = usesColor && tool !== "eyedropper";

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <header className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <def.icon className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">{def.label}</h2>
          <p className="text-[11px] text-muted-foreground">{def.hint}</p>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={tool}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="space-y-5"
        >
          {(usesSize || isShape) && (
            <section className="space-y-3">
              <BrushPreview style={style} tool={tool} />
              {usesSize && (
                <Field label="Size" value={`${style.size}px`}>
                  <Slider
                    aria-label="Brush size"
                    value={[style.size]}
                    min={1}
                    max={160}
                    step={1}
                    onValueChange={([v]) => patchStyle({ size: v ?? 1 })}
                  />
                </Field>
              )}
              {tool === "brush" && (
                <Field label="Smoothing" value={`${Math.round(style.smoothing * 100)}%`}>
                  <Slider
                    aria-label="Line smoothing"
                    value={[style.smoothing * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => patchStyle({ smoothing: (v ?? 0) / 100 })}
                  />
                </Field>
              )}
              {tool === "brush" && (
                <Field label="Brush shape">
                  <Segmented
                    options={[
                      { value: "round", label: "Round" },
                      { value: "square", label: "Square" },
                    ]}
                    value={style.shape}
                    onChange={(v) => patchStyle({ shape: v as BrushShape })}
                  />
                </Field>
              )}
              {(tool === "rect" || tool === "circle") && (
                <>
                  <Field label="Shape mode">
                    <Segmented
                      options={[
                        { value: "stroke", label: "Stroke" },
                        { value: "fill", label: "Fill" },
                        { value: "both", label: "Both" },
                      ]}
                      value={style.shapeMode}
                      onChange={(v) => patchStyle({ shapeMode: v as ShapeMode })}
                    />
                  </Field>
                  {style.shapeMode !== "fill" && (
                    <Field label="Border width" value={`${style.borderWidth}px`}>
                      <Slider
                        aria-label="Shape border width"
                        value={[style.borderWidth]}
                        min={1}
                        max={60}
                        step={1}
                        onValueChange={([v]) => patchStyle({ borderWidth: v ?? 1 })}
                      />
                    </Field>
                  )}
                </>
              )}
            </section>
          )}

          {usesOpacity && (
            <Field
              label={tool === "brush" ? "Brush opacity" : `${def.label} opacity`}
              value={`${Math.round(style.opacity * 100)}%`}
            >
              <Slider
                aria-label={tool === "brush" ? "Brush opacity" : `${def.label} opacity`}
                value={[style.opacity * 100]}
                min={5}
                max={100}
                step={1}
                onValueChange={([v]) => patchStyle({ opacity: (v ?? 100) / 100 })}
              />
            </Field>
          )}

          {tool === "select" && (
            <div className="rounded-xl border border-border bg-surface-2/50 p-3 text-xs text-muted-foreground">
              Drag on the canvas to select an area, then press{" "}
              <kbd className="rounded bg-surface px-1 font-mono">Delete</kbd> to clear it.
            </div>
          )}

          {tool === "hand" && (
            <div className="rounded-xl border border-border bg-surface-2/50 p-3 text-xs text-muted-foreground">
              Drag to pan the workspace. Hold <kbd className="rounded bg-surface px-1">Space</kbd>{" "}
              with any tool for temporary panning, scroll to zoom.
            </div>
          )}

          {usesColor && (
            <ColorStudio
              color={style.color}
              onChange={(c) => patchStyle({ color: c })}
              recent={recent}
              saved={saved}
              onSave={onSaveColor}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-auto space-y-4 border-t border-border pt-4">
        <CanvasBackground engine={engine} />
        <LayersPanel engine={engine} onChange={onChange} />
      </div>
    </div>
  );
}

function CanvasBackground({ engine }: { engine: CanvasEngine }) {
  const color = engine.backgroundColor;
  const [hex, setHex] = useState(color ?? "");

  useEffect(() => setHex(color ?? ""), [color]);

  const apply = (next: string) => {
    const normalized = normalizeHex(next);
    setHex(normalized);
    engine.setBackgroundColor(normalized);
  };

  return (
    <section className="space-y-2.5" aria-label="Canvas background settings">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Canvas background
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/70">Behind every drawing layer</p>
        </div>
        <button
          type="button"
          aria-label="Use transparent canvas background"
          aria-pressed={color === null}
          onClick={() => engine.setBackgroundColor(null)}
          className={cn(
            "rounded-lg border px-2 py-1 text-[10px] transition-colors",
            color === null
              ? "border-primary bg-primary/15 text-primary"
              : "border-border bg-surface-2 text-muted-foreground hover:text-foreground",
          )}
        >
          Transparent
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label
          className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-[repeating-conic-gradient(#d1d5db_0%_25%,#fff_0%_50%)] bg-[length:12px_12px]"
          aria-label="Choose canvas background color"
        >
          {color && <span className="absolute inset-0" style={{ backgroundColor: color }} />}
          <input
            type="color"
            value={color ?? "#ffffff"}
            onChange={(event) => apply(event.target.value)}
            className="sr-only"
          />
        </label>
        <Input
          value={hex}
          placeholder="Transparent"
          aria-label="Canvas background hex color"
          onChange={(event) => {
            const next = event.target.value;
            setHex(next);
            if (isValidHex(next)) engine.setBackgroundColor(normalizeHex(next));
          }}
          onBlur={() => setHex(engine.backgroundColor ?? "")}
          className="h-9 font-mono text-xs uppercase"
        />
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Use ${swatch} as canvas background`}
            aria-pressed={color?.toLowerCase() === swatch.toLowerCase()}
            onClick={() => apply(swatch)}
            className={cn(
              "aspect-square rounded-lg border border-foreground/10 transition-transform hover:scale-110",
              color?.toLowerCase() === swatch.toLowerCase() &&
                "ring-2 ring-primary ring-offset-2 ring-offset-surface",
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {value && <span className="font-mono text-[11px] text-foreground/80">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "relative flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
            value === o.value ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${options.map((x) => x.value).join()}`}
              className="absolute inset-0 rounded-lg bg-primary"
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function BrushPreview({ style, tool }: { style: StrokeStyle; tool: ToolId }) {
  const size = Math.min(84, Math.max(4, style.size));
  return (
    <div className="grid h-24 place-items-center overflow-hidden rounded-xl border border-border bg-[repeating-conic-gradient(var(--surface-2)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
      <motion.div
        animate={{ width: size, height: size, opacity: tool === "eraser" ? 0.35 : style.opacity }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        style={{
          backgroundColor: tool === "eraser" ? "#ffffff" : style.color,
          borderRadius: style.shape === "square" ? 4 : 999,
        }}
      />
    </div>
  );
}
