import { motion } from "motion/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TOOLS } from "@/lib/studio/tools";
import type { ToolId } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

interface Props {
  tool: ToolId;
  onChange: (tool: ToolId) => void;
  className?: string;
  orientation?: "vertical" | "horizontal";
}

export function ToolsPanel({ tool, onChange, className, orientation = "vertical" }: Props) {
  return (
    <TooltipProvider delayDuration={180}>
      <div
        role="toolbar"
        aria-label="Drawing tools"
        aria-orientation={orientation}
        className={cn(
          "surface-panel flex rounded-2xl",
          orientation === "vertical" ? "flex-col gap-1.5 p-2" : "w-full flex-row gap-1 p-1.5",
          className,
        )}
      >
        {TOOLS.map((t) => {
          const active = tool === t.id;
          return (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${t.label} (${t.shortcut})`}
                  aria-pressed={active}
                  onClick={() => onChange(t.id)}
                  className={cn(
                    "relative grid place-items-center rounded-xl text-muted-foreground transition-colors",
                    orientation === "vertical" ? "size-11 shrink-0" : "h-10 min-w-0 flex-1",
                    "hover:bg-surface-2 hover:text-foreground",
                    active && "text-primary-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="tool-indicator"
                      transition={{ type: "spring", stiffness: 520, damping: 34 }}
                      className="glow-primary absolute inset-0 rounded-xl bg-primary"
                    />
                  )}
                  <t.icon className="relative size-[18px]" strokeWidth={2.1} />
                </button>
              </TooltipTrigger>
              <TooltipContent side={orientation === "vertical" ? "right" : "top"}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">{t.label}</span>
                  <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                    {t.shortcut}
                  </kbd>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{t.hint}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
