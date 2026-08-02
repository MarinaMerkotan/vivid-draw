import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Undo2,
  Redo2,
  Download,
  Check,
  Loader2,
  CloudUpload,
  Trash2,
  PlayCircle,
  CircleAlert,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandWordmark } from "@/components/brand-wordmark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SaveState } from "@/lib/studio/use-studio";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  onTitleChange: (v: string) => void;
  saveState: SaveState;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: (type: "image/png" | "image/webp") => void;
  onReplay: () => void;
  exporting: boolean;
  exported: boolean;
}

const SAVE_LABEL: Record<SaveState, string> = {
  idle: "All changes saved",
  dirty: "Unsaved changes",
  saving: "Autosaving…",
  saved: "Saved",
  error: "Save failed",
};

export function TopBar(props: Props) {
  const [confirmClear, setConfirmClear] = useState(false);
  const {
    title,
    onTitleChange,
    saveState,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExport,
    onReplay,
    exporting,
    exported,
  } = props;

  return (
    <TooltipProvider delayDuration={200}>
      <header className="z-30 flex h-14 shrink-0 items-center gap-1 border-b border-border bg-surface/80 px-2 backdrop-blur sm:gap-3 sm:px-3">
        <Link href="/" className="flex items-center gap-2.5 sm:pr-2" aria-label="Back to dashboard">
          <span className="grid size-10 place-items-center overflow-hidden rounded-xl sm:size-11">
            <Image
              src="/logo-mark.webp"
              alt="Vividraw logo"
              width={44}
              height={44}
              priority
              unoptimized
              className="size-10 object-contain sm:size-11"
            />
          </span>
          <span className="hidden sm:block">
            <BrandWordmark />
          </span>
        </Link>

        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Drawing title"
          className="hidden h-9 min-w-0 flex-1 border-transparent bg-transparent font-display text-sm font-medium hover:border-border focus-visible:border-border sm:flex sm:max-w-44 lg:max-w-56"
        />

        <span
          aria-live="polite"
          className={cn(
            "hidden items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground md:flex",
            saveState === "error" && "text-destructive",
          )}
        >
          {saveState === "saving" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : saveState === "error" ? (
            <CircleAlert className="size-3" />
          ) : saveState === "dirty" ? (
            <CloudUpload className="size-3" />
          ) : (
            <Check className="size-3 text-lime" />
          )}
          {SAVE_LABEL[saveState]}
        </span>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <IconAction label="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="size-4" />
          </IconAction>
          <IconAction label="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="size-4" />
          </IconAction>
          <div className="hidden items-center gap-1 md:flex">
            <IconAction label="Clear canvas" onClick={() => setConfirmClear(true)}>
              <Trash2 className="size-4" />
            </IconAction>
            <IconAction label="Replay drawing" onClick={onReplay}>
              <PlayCircle className="size-4" />
            </IconAction>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More canvas actions"
                className="grid size-8 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground md:hidden"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setConfirmClear(true)}>
                <Trash2 className="size-4" /> Clear canvas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onReplay}>
                <PlayCircle className="size-4" /> Replay drawing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Export drawing"
                className="glow-primary relative ml-0.5 size-9 overflow-hidden px-0 font-display font-semibold sm:ml-1 sm:h-9 sm:w-auto sm:px-4"
                disabled={exporting}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {exporting ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Loader2 className="size-4 animate-spin" /> <span className="hidden sm:inline">Exporting</span>
                    </motion.span>
                  ) : exported ? (
                    <motion.span
                      key="done"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="size-4" /> <span className="hidden sm:inline">Exported</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Download className="size-4" /> <span className="hidden sm:inline">Export</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport("image/png")}>
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("image/webp")}>
                Export as WebP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear the canvas?</AlertDialogTitle>
              <AlertDialogDescription>
                This erases every layer of “{title}”. You can undo the last clear, but the recorded
                replay will be reset.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep drawing</AlertDialogCancel>
              <AlertDialogAction onClick={props.onClear}>Clear canvas</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>
    </TooltipProvider>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          whileTap={{ scale: 0.88 }}
          className="grid size-8 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:pointer-events-none disabled:opacity-35 sm:size-9"
        >
          {children}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
