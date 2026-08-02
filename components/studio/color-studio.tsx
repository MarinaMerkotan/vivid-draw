import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dices, Check, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PALETTES,
  SWATCHES,
  hslToHex,
  isValidHex,
  normalizeHex,
  randomColor,
} from "@/lib/studio/palettes";
import { cn } from "@/lib/utils";

interface Props {
  color: string;
  onChange: (color: string) => void;
  recent: string[];
  saved: string[];
  onSave: (color: string) => void;
}

export function ColorStudio({ color, onChange, recent, saved, onSave }: Props) {
  const [hex, setHex] = useState(color);
  const [hue, setHue] = useState(8);
  const [light, setLight] = useState(55);
  const [sat, setSat] = useState(85);

  useEffect(() => setHex(color), [color]);

  const applyHsl = (h: number, s: number, l: number) => {
    setHue(h);
    setSat(s);
    setLight(l);
    onChange(hslToHex(h, s, l));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Selected color ${color}. Open color picker`}
              className="relative size-14 shrink-0 rounded-2xl border-2 border-border transition-transform hover:scale-[1.04] active:scale-95"
              style={{ backgroundColor: color, boxShadow: `0 8px 26px -10px ${color}` }}
            >
              <AnimatePresence>
                <motion.span
                  key={color}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 480, damping: 26 }}
                  className="absolute inset-0 rounded-2xl ring-2 ring-foreground/10"
                />
              </AnimatePresence>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-3" align="start">
            <p className="text-xs font-medium text-muted-foreground">Color picker</p>
            <div
              className="h-24 rounded-xl border border-border"
              style={{
                background: `linear-gradient(to right, #fff, ${hslToHex(hue, sat, 50)}, #000)`,
              }}
            />
            <label className="block text-[11px] text-muted-foreground">
              Hue
              <input
                type="range"
                min={0}
                max={359}
                value={hue}
                onChange={(e) => applyHsl(Number(e.target.value), sat, light)}
                className="mt-1 w-full accent-primary"
                aria-label="Hue"
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Saturation
              <input
                type="range"
                min={0}
                max={100}
                value={sat}
                onChange={(e) => applyHsl(hue, Number(e.target.value), light)}
                className="mt-1 w-full accent-primary"
                aria-label="Saturation"
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Lightness
              <input
                type="range"
                min={0}
                max={100}
                value={light}
                onChange={(e) => applyHsl(hue, sat, Number(e.target.value))}
                className="mt-1 w-full accent-primary"
                aria-label="Lightness"
              />
            </label>
          </PopoverContent>
        </Popover>

        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={hex}
            aria-label="Hex color value"
            onChange={(e) => {
              setHex(e.target.value);
              if (isValidHex(e.target.value)) onChange(normalizeHex(e.target.value));
            }}
            className="h-9 font-mono text-xs uppercase"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 flex-1 text-xs"
              onClick={() => onChange(randomColor())}
            >
              <Dices className="size-3.5" /> Random
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-2"
              aria-label="Save color to palette"
              onClick={() => onSave(color)}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Swatches label="Swatches" colors={SWATCHES} active={color} onPick={onChange} />
      {recent.length > 0 && (
        <Swatches label="Recent" colors={recent.slice(0, 12)} active={color} onPick={onChange} />
      )}
      {saved.length > 0 && (
        <Swatches label="Saved" colors={saved.slice(0, 12)} active={color} onPick={onChange} />
      )}

      <div className="space-y-2">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Palettes
        </p>
        <div className="space-y-2">
          {PALETTES.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface-2/60 p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium">{p.name}</span>
              </div>
              <div className="flex gap-1">
                {p.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`${p.name} color ${c}`}
                    onClick={() => onChange(c)}
                    className="h-6 flex-1 rounded-md border border-foreground/10 transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Swatches({
  label,
  colors,
  active,
  onPick,
}: {
  label: string;
  colors: string[];
  active: string;
  onPick: (c: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="grid grid-cols-6 gap-1.5">
        {colors.map((c, i) => {
          const isActive = c.toLowerCase() === active.toLowerCase();
          return (
            <motion.button
              key={`${c}-${i}`}
              type="button"
              aria-label={`Use color ${c}`}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.12 }}
              onClick={() => onPick(c)}
              className={cn(
                "relative grid aspect-square place-items-center rounded-lg border border-foreground/10",
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
              )}
              style={{ backgroundColor: c }}
            >
              {isActive && <Check className="size-3 text-white mix-blend-difference" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
