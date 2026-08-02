export interface Palette {
  id: string;
  name: string;
  colors: string[];
}

export const PALETTES: Palette[] = [
  {
    id: "neon-dusk",
    name: "Neon Dusk",
    colors: ["#FF4D3D", "#FF9F1C", "#FFE066", "#7C4DFF", "#22D3EE", "#0B0B14"],
  },
  {
    id: "riso",
    name: "Riso Print",
    colors: ["#F1436E", "#3D5AFE", "#00C2A8", "#FFD23F", "#1B1B1B", "#FFF6E9"],
  },
  {
    id: "botanic",
    name: "Botanic",
    colors: ["#2F6B4F", "#7FBF5A", "#D9E67C", "#C4783C", "#4A2C1A", "#F3EDE1"],
  },
  {
    id: "vapor",
    name: "Vapor",
    colors: ["#FF6EC7", "#B06CFF", "#6C8CFF", "#6CE5FF", "#FFF0F7", "#231540"],
  },
  {
    id: "ember",
    name: "Ember",
    colors: ["#FF3B00", "#FF7A00", "#FFB800", "#8C1C03", "#2B0F06", "#FFE9D6"],
  },
];

export const SWATCHES = [
  "#0B0B14",
  "#4B4B5A",
  "#9AA0AC",
  "#FFFFFF",
  "#FF4D3D",
  "#FF7A00",
  "#FFC93C",
  "#7FE05A",
  "#22D3EE",
  "#3D5AFE",
  "#7C4DFF",
  "#F1436E",
];

export function randomColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 65 + Math.floor(Math.random() * 30);
  const l = 45 + Math.floor(Math.random() * 20);
  return hslToHex(h, s, l);
}

export function hslToHex(h: number, s: number, l: number) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full || "000000", 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

export function isValidHex(value: string) {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function normalizeHex(value: string) {
  const v = value.trim().replace("#", "");
  const full =
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v;
  return `#${full.toLowerCase()}`;
}
