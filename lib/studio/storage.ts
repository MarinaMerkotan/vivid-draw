import type { Drawing, SerializedLayer } from "./types";
import { uid } from "./engine";
import { makeSampleArt } from "./sample-art";

const KEY = "prisma-studio.drawings.v1";
const LAST_KEY = "prisma-studio.last-open";
const LAYER_NAME_MIGRATION_KEY = "prisma-studio.layer-names.v2";

function read(): Drawing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Drawing[];
    if (!Array.isArray(parsed)) return [];
    const migrateLayerNames = window.localStorage.getItem(LAYER_NAME_MIGRATION_KEY) !== "done";
    const drawings = parsed.map((drawing) => ({
          ...drawing,
          backgroundColor:
            drawing.backgroundColor === null ? null : drawing.backgroundColor ?? "#ffffff",
          layers: drawing.layers.map((layer, index) => ({
            ...layer,
            name: migrateLayerNames && index === 0 && layer.name === "Background" ? "Layer 1" : layer.name,
          })),
        }));
    if (migrateLayerNames) {
      window.localStorage.setItem(KEY, JSON.stringify(drawings));
      window.localStorage.setItem(LAYER_NAME_MIGRATION_KEY, "done");
    }
    return drawings;
  } catch {
    return [];
  }
}

function write(list: Drawing[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function listDrawings(): Drawing[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getDrawing(id: string): Drawing | undefined {
  return read().find((d) => d.id === id);
}

export function saveDrawing(drawing: Drawing) {
  const list = read();
  const idx = list.findIndex((d) => d.id === drawing.id);
  if (idx >= 0) list[idx] = drawing;
  else list.push(drawing);
  if (!write(list)) throw new Error("Browser storage is full or unavailable");
}

export function deleteDrawing(id: string) {
  return write(read().filter((d) => d.id !== id));
}

export function createDrawing(title: string, width: number, height: number, accent: string) {
  const now = Date.now();
  const layers: SerializedLayer[] = [
    { id: uid(), name: "Layer 1", visible: true, opacity: 1, data: null },
  ];
  const drawing: Drawing = {
    id: uid(),
    title,
    width,
    height,
    backgroundColor: "#ffffff",
    createdAt: now,
    updatedAt: now,
    thumbnail: null,
    layers,
    actions: [],
    accent,
  };
  saveDrawing(drawing);
  return drawing;
}

export function setLastOpen(id: string) {
  try {
    window.localStorage.setItem(LAST_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getLastOpen(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

/** Seeds a few realistic sample drawings the first time the studio is opened. */
export function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (read().length) return;
  const samples = makeSampleArt();
  const now = Date.now();
  const seeded: Drawing[] = samples.map((s, i) => ({
    id: uid(),
    title: s.title,
    width: s.width,
    height: s.height,
    backgroundColor: "#ffffff",
    createdAt: now - (i + 1) * 86400000,
    updatedAt: now - (i + 1) * 3600000 * (i + 2),
    thumbnail: s.thumbnail,
    layers: [{ id: uid(), name: "Artwork", visible: true, opacity: 1, data: s.data }],
    actions: [],
    accent: s.accent,
  }));
  return write(seeded);
}

export const DAILY_PROMPTS = [
  "Draw the sound of a thunderstorm using only three colors.",
  "Sketch a city skyline that grows out of a plant.",
  "Illustrate a feeling you had this morning as a shape.",
  "Make a poster for a festival that doesn't exist yet.",
  "Draw your favourite object without lifting the brush.",
  "Compose an abstract piece using only circles and one line.",
  "Design a creature made entirely of geometry.",
];

export function promptOfTheDay() {
  const day = Math.floor(Date.now() / 86400000);
  return DAILY_PROMPTS[day % DAILY_PROMPTS.length]!;
}
