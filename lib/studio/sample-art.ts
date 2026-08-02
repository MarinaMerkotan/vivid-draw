export interface SampleArt {
  title: string;
  width: number;
  height: number;
  data: string;
  thumbnail: string;
  accent: string;
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function rnd(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function sunsetRidges(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = rnd(7);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#2B1055");
  sky.addColorStop(0.55, "#F1436E");
  sky.addColorStop(1, "#FFB800");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#FFE066";
  ctx.beginPath();
  ctx.arc(w * 0.68, h * 0.42, h * 0.13, 0, Math.PI * 2);
  ctx.fill();
  const bands = ["#7C1F4F", "#5A1240", "#3A0B2E", "#20061D"];
  bands.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const base = h * (0.55 + i * 0.11);
    ctx.moveTo(0, h);
    ctx.lineTo(0, base);
    for (let x = 0; x <= w; x += w / 12) {
      ctx.lineTo(x, base - r() * h * 0.09 - i * 4);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 22; i++) {
    ctx.beginPath();
    const y = h * 0.2 + r() * h * 0.2;
    ctx.moveTo(r() * w, y);
    ctx.lineTo(r() * w, y + r() * 8);
    ctx.stroke();
  }
}

function neonBloom(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#0B0B14";
  ctx.fillRect(0, 0, w, h);
  const r = rnd(21);
  const colors = ["#FF4D3D", "#7C4DFF", "#22D3EE", "#FFE066", "#FF6EC7"];
  for (let i = 0; i < 90; i++) {
    const cx = w / 2 + (r() - 0.5) * w * 0.7;
    const cy = h / 2 + (r() - 0.5) * h * 0.7;
    const rad = 10 + r() * Math.min(w, h) * 0.2;
    ctx.globalAlpha = 0.16 + r() * 0.25;
    ctx.strokeStyle = colors[Math.floor(r() * colors.length)]!;
    ctx.lineWidth = 2 + r() * 5;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, r() * 6, r() * 6 + 2 + r() * 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.8);
  for (let x = w * 0.15; x < w * 0.85; x += 12) {
    ctx.lineTo(x, h * 0.8 - Math.sin(x / 60) * h * 0.12);
  }
  ctx.stroke();
}

function risoStudy(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#FFF6E9";
  ctx.fillRect(0, 0, w, h);
  const r = rnd(99);
  ctx.globalCompositeOperation = "multiply";
  const shapes: Array<[string, number]> = [
    ["#F1436E", 0],
    ["#3D5AFE", 1],
    ["#00C2A8", 2],
  ];
  shapes.forEach(([color, i]) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(w * (0.35 + i * 0.14), h * (0.42 + (i % 2) * 0.12), Math.min(w, h) * 0.26, 0, 7);
    ctx.fill();
  });
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#1B1B1B";
  ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    const y = h * 0.08 + i * (h * 0.021);
    ctx.moveTo(w * 0.08, y);
    ctx.lineTo(w * 0.08 + r() * w * 0.2, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#1B1B1B";
  ctx.fillRect(w * 0.08, h * 0.86, w * 0.36, 10);
}

function chromaticWaves(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#0F172A");
  g.addColorStop(1, "#231540");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const colors = ["#FF4D3D", "#FF9F1C", "#7FE05A", "#22D3EE", "#7C4DFF"];
  for (let i = 0; i < 46; i++) {
    ctx.strokeStyle = colors[i % colors.length]!;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y =
        h * 0.5 +
        Math.sin(x / 110 + i * 0.25) * h * 0.18 +
        Math.cos(x / 47 + i * 0.12) * h * 0.06 +
        (i - 23) * 7;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

const RECIPES: Array<{
  title: string;
  width: number;
  height: number;
  accent: string;
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}> = [
  { title: "Sunset Ridges", width: 1600, height: 900, accent: "#FF7A00", paint: sunsetRidges },
  { title: "Neon Bloom", width: 1080, height: 1080, accent: "#7C4DFF", paint: neonBloom },
  { title: "Riso Study 04", width: 1080, height: 1350, accent: "#F1436E", paint: risoStudy },
  { title: "Chromatic Waves", width: 1500, height: 1000, accent: "#22D3EE", paint: chromaticWaves },
];

export function makeSampleArt(): SampleArt[] {
  return RECIPES.map((recipe) => {
    const c = canvas(recipe.width, recipe.height);
    const ctx = c.getContext("2d")!;
    recipe.paint(ctx, recipe.width, recipe.height);
    const scale = Math.min(1, 560 / recipe.width);
    const t = canvas(Math.round(recipe.width * scale), Math.round(recipe.height * scale));
    t.getContext("2d")!.drawImage(c, 0, 0, t.width, t.height);
    return {
      title: recipe.title,
      width: recipe.width,
      height: recipe.height,
      accent: recipe.accent,
      data: c.toDataURL("image/webp", 0.85),
      thumbnail: t.toDataURL("image/webp", 0.75),
    };
  });
}
