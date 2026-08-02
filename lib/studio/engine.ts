import type {
  LayerMeta,
  Point,
  RecordedAction,
  SerializedLayer,
  StrokeStyle,
  ToolId,
} from "./types";
import { hexToRgb } from "./palettes";

export interface Layer extends LayerMeta {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

interface HistoryEntry {
  layers: Array<{ layerId: string; image: ImageData }>;
  actions: RecordedAction[];
  backgroundColor: string | null;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MAX_HISTORY = 24;

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** Pure canvas drawing engine. Knows nothing about React. */
export class CanvasEngine {
  width: number;
  height: number;
  layers: Layer[] = [];
  activeLayerId = "";
  selection: Rect | null = null;
  backgroundColor: string | null;

  private view: HTMLCanvasElement | null = null;
  private viewCtx: CanvasRenderingContext2D | null = null;
  private preview = makeCanvas(1, 1);
  private previewCtx: CanvasRenderingContext2D;
  private frame = 0;
  private dirty = false;

  private drawing = false;
  private tool: ToolId = "brush";
  private style: StrokeStyle | null = null;
  private points: Point[] = [];
  private startPoint: Point | null = null;

  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  actions: RecordedAction[] = [];
  onChange: (() => void) | null = null;
  onCommit: (() => void) | null = null;

  constructor(width: number, height: number, backgroundColor: string | null = "#ffffff") {
    this.width = width;
    this.height = height;
    this.backgroundColor = backgroundColor;
    this.preview = makeCanvas(width, height);
    this.previewCtx = this.preview.getContext("2d")!;
    this.addLayer("Layer 1");
  }

  /* ---------------- layers ---------------- */

  get activeLayer() {
    return this.layers.find((l) => l.id === this.activeLayerId) ?? this.layers[0]!;
  }

  addLayer(name?: string, atTop = true) {
    const canvas = makeCanvas(this.width, this.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const layer: Layer = {
      id: uid(),
      name: name ?? `Layer ${this.layers.length + 1}`,
      visible: true,
      opacity: 1,
      canvas,
      ctx,
    };
    if (atTop) this.layers.push(layer);
    else this.layers.unshift(layer);
    this.activeLayerId = layer.id;
    this.requestRender();
    this.notify();
    return layer;
  }

  removeLayer(id: string) {
    if (this.layers.length <= 1) return;
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx < 0) return;
    this.layers.splice(idx, 1);
    if (this.activeLayerId === id) {
      this.activeLayerId = this.layers[Math.max(0, idx - 1)]!.id;
    }
    this.requestRender();
    this.notify();
  }

  updateLayer(id: string, patch: Partial<LayerMeta>) {
    const layer = this.layers.find((l) => l.id === id);
    if (!layer) return;
    Object.assign(layer, patch);
    this.requestRender();
    this.notify();
  }

  moveLayer(id: string, dir: -1 | 1) {
    const idx = this.layers.findIndex((l) => l.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= this.layers.length) return;
    const [layer] = this.layers.splice(idx, 1);
    this.layers.splice(next, 0, layer!);
    this.requestRender();
    this.notify();
  }

  setActiveLayer(id: string) {
    this.activeLayerId = id;
    this.notify();
  }

  /* ---------------- rendering ---------------- */

  attach(view: HTMLCanvasElement) {
    this.view = view;
    view.width = this.width;
    view.height = this.height;
    this.viewCtx = view.getContext("2d")!;
    this.requestRender();
  }

  detach() {
    this.view = null;
    this.viewCtx = null;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  requestRender() {
    this.dirty = true;
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      if (this.dirty) this.render();
    });
  }

  render() {
    this.dirty = false;
    const ctx = this.viewCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.width, this.height);
    if (this.backgroundColor) {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0);
      if (layer.id === this.activeLayerId && this.drawing) {
        ctx.drawImage(this.preview, 0, 0);
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ---------------- history ---------------- */

  private capture(layers: Layer[]): HistoryEntry {
    return {
      layers: layers.map((layer) => ({
        layerId: layer.id,
        image: layer.ctx.getImageData(0, 0, this.width, this.height),
      })),
      actions: this.actions.slice(),
      backgroundColor: this.backgroundColor,
    };
  }

  private snapshot(...layers: Layer[]) {
    this.undoStack.push({
      ...this.capture(layers),
    });
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
    this.redoStack = [];
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }
  get canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return false;
    const affected = this.layers.filter((layer) =>
      entry.layers.some((item) => item.layerId === layer.id),
    );
    if (!affected.length && entry.backgroundColor === this.backgroundColor) return false;
    this.redoStack.push(this.capture(affected));
    for (const item of entry.layers) {
      this.layers.find((layer) => layer.id === item.layerId)?.ctx.putImageData(item.image, 0, 0);
    }
    this.actions = entry.actions.slice();
    this.backgroundColor = entry.backgroundColor;
    this.requestRender();
    this.notify();
    this.onCommit?.();
    return true;
  }

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return false;
    const affected = this.layers.filter((layer) =>
      entry.layers.some((item) => item.layerId === layer.id),
    );
    if (!affected.length && entry.backgroundColor === this.backgroundColor) return false;
    this.undoStack.push(this.capture(affected));
    for (const item of entry.layers) {
      this.layers.find((layer) => layer.id === item.layerId)?.ctx.putImageData(item.image, 0, 0);
    }
    this.actions = entry.actions.slice();
    this.backgroundColor = entry.backgroundColor;
    this.requestRender();
    this.notify();
    this.onCommit?.();
    return true;
  }

  /* ---------------- drawing ---------------- */

  beginStroke(pt: Point, tool: ToolId, style: StrokeStyle) {
    const layer = this.activeLayer;
    if (!layer) return;
    this.snapshot(layer);
    this.drawing = true;
    this.tool = tool;
    this.style = style;
    this.startPoint = pt;
    this.points = [pt];
    this.previewCtx.clearRect(0, 0, this.width, this.height);
    if (tool === "brush" || tool === "eraser") {
      this.paintSegment(layer.ctx, pt, pt, style, tool === "eraser");
    }
    this.requestRender();
  }

  extendStroke(pt: Point) {
    if (!this.drawing || !this.style) return;
    const layer = this.activeLayer;
    const style = this.style;
    if (this.tool === "brush" || this.tool === "eraser") {
      const last = this.points[this.points.length - 1]!;
      const s = style.smoothing;
      const smoothed: Point = {
        x: last.x + (pt.x - last.x) * (1 - s * 0.75),
        y: last.y + (pt.y - last.y) * (1 - s * 0.75),
        t: pt.t,
        p: pt.p,
      };
      this.paintSegment(layer.ctx, last, smoothed, style, this.tool === "eraser");
      this.points.push(smoothed);
    } else {
      this.points = [this.startPoint!, pt];
      this.previewCtx.clearRect(0, 0, this.width, this.height);
      if (this.tool === "select") {
        this.drawMarquee(this.previewCtx, this.startPoint!, pt);
      } else {
        this.drawShape(this.previewCtx, this.tool, this.startPoint!, pt, style);
      }
    }
    this.requestRender();
  }

  endStroke() {
    if (!this.drawing || !this.style) return;
    const layer = this.activeLayer;
    const style = this.style;
    const tool = this.tool;
    if (tool === "select") {
      const a = this.startPoint!;
      const b = this.points[this.points.length - 1]!;
      const rect = {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        w: Math.abs(b.x - a.x),
        h: Math.abs(b.y - a.y),
      };
      this.selection = rect.w > 4 && rect.h > 4 ? rect : null;
      this.undoStack.pop();
    } else if (tool !== "brush" && tool !== "eraser") {
      this.drawShape(layer.ctx, tool, this.startPoint!, this.points[this.points.length - 1]!, style);
    }
    this.previewCtx.clearRect(0, 0, this.width, this.height);
    this.drawing = false;
    if (tool !== "select") {
      this.actions.push({
        id: uid(),
        tool,
        style: { ...style },
        layerId: layer.id,
        points: this.points.map((p) => ({ ...p })),
        startedAt: this.points[0]?.t ?? 0,
        endedAt: this.points[this.points.length - 1]!?.t ?? 0,
      });
    }
    this.points = [];
    this.style = null;
    this.requestRender();
    this.notify();
    this.onCommit?.();
  }

  private paintSegment(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    style: StrokeStyle,
    erase: boolean,
  ) {
    ctx.save();
    ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
    ctx.globalAlpha = erase ? 1 : style.opacity;
    ctx.strokeStyle = style.color;
    ctx.fillStyle = style.color;
    ctx.lineWidth = style.size;
    ctx.lineCap = style.shape === "square" ? "square" : "round";
    ctx.lineJoin = style.shape === "square" ? "miter" : "round";
    ctx.beginPath();
    if (from.x === to.x && from.y === to.y) {
      ctx.arc(from.x, from.y, Math.max(0.4, style.size / 2), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    tool: ToolId,
    a: Point,
    b: Point,
    style: StrokeStyle,
  ) {
    ctx.save();
    ctx.globalAlpha = style.opacity;
    ctx.strokeStyle = style.color;
    ctx.fillStyle = style.color;
    ctx.lineWidth = tool === "line" ? style.size : style.borderWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (tool === "line") {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    } else if (tool === "rect") {
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const w = Math.abs(b.x - a.x);
      const h = Math.abs(b.y - a.y);
      const r = Math.min(12, w / 2, h / 2);
      ctx.roundRect(x, y, w, h, r);
      if (style.shapeMode !== "stroke") ctx.fill();
      if (style.shapeMode !== "fill") ctx.stroke();
    } else if (tool === "circle") {
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      ctx.ellipse(cx, cy, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
      if (style.shapeMode !== "stroke") ctx.fill();
      if (style.shapeMode !== "fill") ctx.stroke();
    }
    ctx.restore();
  }

  private drawMarquee(ctx: CanvasRenderingContext2D, a: Point, b: Point) {
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "#22D3EE";
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    ctx.restore();
  }

  clearSelectionArea() {
    if (!this.selection) return;
    const layer = this.activeLayer;
    this.snapshot(layer);
    const { x, y, w, h } = this.selection;
    layer.ctx.clearRect(x, y, w, h);
    this.selection = null;
    this.requestRender();
    this.notify();
    this.onCommit?.();
  }

  /* ---------------- tools ---------------- */

  setBackgroundColor(color: string | null) {
    if (color === this.backgroundColor) return;
    this.snapshot();
    this.backgroundColor = color;
    this.requestRender();
    this.notify();
    this.onCommit?.();
  }

  pickColor(pt: Point): string {
    const ctx = this.viewCtx;
    if (!ctx) return "#000000";
    const d = ctx.getImageData(Math.floor(pt.x), Math.floor(pt.y), 1, 1).data;
    return `#${[d[0]!, d[1]!, d[2]!].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  floodFill(pt: Point, color: string, tolerance = 32) {
    const layer = this.activeLayer;
    this.snapshot(layer);
    fillRegion(layer.ctx, this.width, this.height, pt, color, tolerance);
    this.actions.push({
      id: uid(),
      tool: "fill",
      style: {
        color,
        size: 1,
        opacity: 1,
        smoothing: 0,
        shape: "round",
        shapeMode: "fill",
        borderWidth: 1,
      },
      layerId: layer.id,
      points: [pt],
      startedAt: pt.t,
      endedAt: pt.t,
    });
    this.requestRender();
    this.notify();
    this.onCommit?.();
  }

  clearAll() {
    this.snapshot(...this.layers);
    for (const l of this.layers) l.ctx.clearRect(0, 0, this.width, this.height);
    this.actions = [];
    this.requestRender();
    this.notify();
    this.onCommit?.();
  }

  /* ---------------- io ---------------- */

  flatten(): HTMLCanvasElement {
    const out = makeCanvas(this.width, this.height);
    const ctx = out.getContext("2d")!;
    if (this.backgroundColor) {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    return out;
  }

  toDataURL(type: "image/png" | "image/webp" = "image/png", quality = 0.92) {
    return this.flatten().toDataURL(type, quality);
  }

  thumbnail(maxW = 480) {
    const scale = Math.min(1, maxW / this.width);
    const out = makeCanvas(Math.round(this.width * scale), Math.round(this.height * scale));
    const ctx = out.getContext("2d")!;
    ctx.drawImage(this.flatten(), 0, 0, out.width, out.height);
    return out.toDataURL("image/webp", 0.7);
  }

  serializeLayers(): SerializedLayer[] {
    return this.layers.map((l) => ({
      id: l.id,
      name: l.name,
      visible: l.visible,
      opacity: l.opacity,
      data: l.canvas.toDataURL("image/png"),
    }));
  }

  async loadLayers(layers: SerializedLayer[]) {
    if (!layers.length) return;
    const built: Layer[] = [];
    for (const meta of layers) {
      const canvas = makeCanvas(this.width, this.height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      if (meta.data) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = meta.data!;
        });
      }
      built.push({ ...meta, canvas, ctx });
    }
    this.layers = built;
    this.activeLayerId = built[built.length - 1]!.id;
    this.requestRender();
    this.notify();
  }

  private notify() {
    this.onChange?.();
  }
}

/** Scanline flood fill on a layer context. */
export function fillRegion(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pt: Point,
  color: string,
  tolerance: number,
) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const startX = Math.floor(pt.x);
  const startY = Math.floor(pt.y);
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return;
  const idx = (startY * width + startX) * 4;
  const target = [data[idx]!, data[idx + 1]!, data[idx + 2]!, data[idx + 3]!];
  const [fr, fg, fb] = hexToRgb(color);
  if (
    Math.abs(target[0]! - fr) < 2 &&
    Math.abs(target[1]! - fg) < 2 &&
    Math.abs(target[2]! - fb) < 2 &&
    target[3]! === 255
  )
    return;

  const match = (i: number) =>
    Math.abs(data[i]! - target[0]!) <= tolerance &&
    Math.abs(data[i + 1]! - target[1]!) <= tolerance &&
    Math.abs(data[i + 2]! - target[2]!) <= tolerance &&
    Math.abs(data[i + 3]! - target[3]!) <= tolerance;

  const stack: number[] = [startX, startY];
  const seen = new Uint8Array(width * height);
  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    let left = x;
    while (left >= 0 && match((y * width + left) * 4)) left--;
    left++;
    let right = x;
    while (right < width && match((y * width + right) * 4)) right++;
    right--;
    for (let i = left; i <= right; i++) {
      const p = y * width + i;
      if (seen[p]) continue;
      seen[p] = 1;
      const o = p * 4;
      data[o] = fr;
      data[o + 1] = fg;
      data[o + 2] = fb;
      data[o + 3] = 255;
      if (y > 0 && !seen[p - width] && match((p - width) * 4)) stack.push(i, y - 1);
      if (y < height - 1 && !seen[p + width] && match((p + width) * 4)) stack.push(i, y + 1);
    }
  }
  ctx.putImageData(image, 0, 0);
}

/** Draw a recorded action on an arbitrary context (used by replay). */
export function replayAction(
  ctx: CanvasRenderingContext2D,
  action: RecordedAction,
  width: number,
  height: number,
  progress = 1,
) {
  const { style, tool, points } = action;
  if (tool === "fill") {
    fillRegion(ctx, width, height, points[0]!, style.color, 32);
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
  ctx.globalAlpha = tool === "eraser" ? 1 : style.opacity;
  ctx.strokeStyle = style.color;
  ctx.fillStyle = style.color;
  ctx.lineCap = style.shape === "square" ? "square" : "round";
  ctx.lineJoin = "round";

  if (tool === "brush" || tool === "eraser") {
    ctx.lineWidth = style.size;
    const count = Math.max(1, Math.floor(points.length * progress));
    if (count === 1) {
      ctx.beginPath();
      ctx.arc(points[0]!.x, points[0]!.y, Math.max(0.4, style.size / 2), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(points[0]!.x, points[0]!.y);
      for (let i = 1; i < count; i++) ctx.lineTo(points[i]!.x, points[i]!.y);
      ctx.stroke();
    }
  } else {
    const a = points[0]!;
    const bFull = points[points.length - 1]!;
    const b = {
      x: a.x + (bFull.x - a.x) * progress,
      y: a.y + (bFull.y - a.y) * progress,
      t: 0,
    };
    ctx.lineWidth = tool === "line" ? style.size : style.borderWidth;
    ctx.beginPath();
    if (tool === "line") {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    } else if (tool === "rect") {
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const w = Math.abs(b.x - a.x);
      const h = Math.abs(b.y - a.y);
      ctx.roundRect(x, y, w, h, Math.min(12, w / 2, h / 2));
      if (style.shapeMode !== "stroke") ctx.fill();
      if (style.shapeMode !== "fill") ctx.stroke();
    } else if (tool === "circle") {
      ctx.ellipse(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2,
        Math.abs(b.x - a.x) / 2,
        Math.abs(b.y - a.y) / 2,
        0,
        0,
        Math.PI * 2,
      );
      if (style.shapeMode !== "stroke") ctx.fill();
      if (style.shapeMode !== "fill") ctx.stroke();
    }
  }
  ctx.restore();
}
