export type ToolId =
  | "brush"
  | "eraser"
  | "line"
  | "rect"
  | "circle"
  | "fill"
  | "eyedropper"
  | "select"
  | "hand";

export type BrushShape = "round" | "square";
export type ShapeMode = "stroke" | "fill" | "both";

export interface StrokeStyle {
  color: string;
  size: number;
  opacity: number;
  smoothing: number;
  shape: BrushShape;
  shapeMode: ShapeMode;
  borderWidth: number;
}

export interface Point {
  x: number;
  y: number;
  t: number;
  p?: number | undefined;
}

export interface RecordedAction {
  id: string;
  tool: ToolId;
  style: StrokeStyle;
  layerId: string;
  points: Point[];
  startedAt: number;
  endedAt: number;
}

export interface LayerMeta {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
}

export interface SerializedLayer extends LayerMeta {
  data: string | null;
}

export interface Drawing {
  id: string;
  title: string;
  width: number;
  height: number;
  backgroundColor: string | null;
  createdAt: number;
  updatedAt: number;
  thumbnail: string | null;
  layers: SerializedLayer[];
  actions: RecordedAction[];
  accent: string;
}

export interface CanvasPreset {
  id: string;
  label: string;
  hint: string;
  width: number;
  height: number;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: "square", label: "Square", hint: "1:1 · 1080×1080", width: 1080, height: 1080 },
  { id: "landscape", label: "Landscape", hint: "16:9 · 1600×900", width: 1600, height: 900 },
  { id: "portrait", label: "Portrait", hint: "4:5 · 1080×1350", width: 1080, height: 1350 },
  { id: "story", label: "Story", hint: "9:16 · 900×1600", width: 900, height: 1600 },
  { id: "poster", label: "Poster", hint: "A4 · 1240×1754", width: 1240, height: 1754 },
  { id: "sketch", label: "Sketchpad", hint: "3:2 · 1500×1000", width: 1500, height: 1000 },
];
