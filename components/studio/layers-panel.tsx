import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Plus, Trash2, ChevronUp, ChevronDown, Check } from "lucide-react";
import type { CanvasEngine } from "@/lib/studio/engine";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  engine: CanvasEngine;
  onChange: () => void;
}

export function LayersPanel({ engine, onChange }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const layers = [...engine.layers].reverse();

  const act = (fn: () => void) => {
    fn();
    onChange();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Layers
        </p>
        <button
          type="button"
          aria-label="Add layer"
          onClick={() => act(() => engine.addLayer())}
          className="grid size-7 place-items-center rounded-lg bg-surface-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="space-y-1.5">
        {layers.map((layer) => {
          const active = layer.id === engine.activeLayerId;
          return (
            <motion.div
              key={layer.id}
              layout
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className={cn(
                "rounded-xl border border-border bg-surface-2/50 p-2 transition-colors",
                active && "border-primary/70 bg-primary/10",
              )}
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={layer.visible ? `Hide ${layer.name}` : `Show ${layer.name}`}
                  onClick={() => act(() => engine.updateLayer(layer.id, { visible: !layer.visible }))}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  {layer.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>

                {editing === layer.id ? (
                  <form
                    className="flex flex-1 items-center gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      act(() => engine.updateLayer(layer.id, { name: draft || layer.name }));
                      setEditing(null);
                    }}
                  >
                    <Input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="h-7 text-xs"
                      aria-label="Layer name"
                    />
                    <button
                      type="submit"
                      aria-label="Save layer name"
                      className="grid size-7 place-items-center rounded-md text-primary"
                    >
                      <Check className="size-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => act(() => engine.setActiveLayer(layer.id))}
                    onDoubleClick={() => {
                      setEditing(layer.id);
                      setDraft(layer.name);
                    }}
                    className="flex-1 truncate text-left text-xs font-medium"
                    title="Click to select, double-click to rename"
                  >
                    {layer.name}
                  </button>
                )}

                <button
                  type="button"
                  aria-label={`Move ${layer.name} up`}
                  onClick={() => act(() => engine.moveLayer(layer.id, 1))}
                  className="grid size-6 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${layer.name} down`}
                  onClick={() => act(() => engine.moveLayer(layer.id, -1))}
                  className="grid size-6 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${layer.name}`}
                  disabled={engine.layers.length <= 1}
                  onClick={() => act(() => engine.removeLayer(layer.id))}
                  className="grid size-6 place-items-center rounded-md text-muted-foreground hover:text-destructive disabled:opacity-30"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="mt-2 space-y-1.5 border-t border-border/60 px-1 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                    Layer opacity
                  </span>
                  <span className="font-mono text-[10px] text-foreground/80">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
                <Slider
                  aria-label={`${layer.name} opacity`}
                  value={[layer.opacity * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) =>
                    act(() => engine.updateLayer(layer.id, { opacity: (v ?? 100) / 100 }))
                  }
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
