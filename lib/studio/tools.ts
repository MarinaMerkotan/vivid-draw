import {
  Brush,
  Eraser,
  Minus,
  Square,
  Circle,
  PaintBucket,
  Pipette,
  SquareDashed,
  Hand,
  type LucideIcon,
} from "lucide-react";
import type { ToolId } from "./types";

export interface ToolDef {
  id: ToolId;
  label: string;
  shortcut: string;
  icon: LucideIcon;
  hint: string;
}

export const TOOLS: ToolDef[] = [
  { id: "brush", label: "Brush", shortcut: "B", icon: Brush, hint: "Freehand painting" },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: Eraser, hint: "Erase pixels" },
  { id: "line", label: "Line", shortcut: "L", icon: Minus, hint: "Straight line" },
  { id: "rect", label: "Rectangle", shortcut: "R", icon: Square, hint: "Rounded rectangle" },
  { id: "circle", label: "Ellipse", shortcut: "O", icon: Circle, hint: "Circle & ellipse" },
  { id: "fill", label: "Fill", shortcut: "G", icon: PaintBucket, hint: "Flood fill a region" },
  { id: "eyedropper", label: "Eyedropper", shortcut: "I", icon: Pipette, hint: "Pick a color" },
  { id: "select", label: "Select", shortcut: "M", icon: SquareDashed, hint: "Marquee selection" },
  { id: "hand", label: "Pan", shortcut: "H", icon: Hand, hint: "Move around the workspace" },
];

export const TOOL_BY_KEY: Record<string, ToolId> = Object.fromEntries(
  TOOLS.map((t) => [t.shortcut.toLowerCase(), t.id]),
);

export const SHAPE_TOOLS: ToolId[] = ["line", "rect", "circle"];
