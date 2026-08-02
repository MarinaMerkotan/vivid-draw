"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createDrawing } from "@/lib/studio/storage";
import { randomColor } from "@/lib/studio/palettes";

const dimension = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(256, Math.min(4096, Math.round(parsed))) : fallback;
};

export default function NewDrawing() {
  return (
    <Suspense fallback={<CreatingCanvas />}>
      <NewDrawingClient />
    </Suspense>
  );
}

function NewDrawingClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const width = dimension(params.get("width"), 1600);
      const height = dimension(params.get("height"), 900);
      const label = params.get("label")?.slice(0, 60) || "Fresh";
      const accent = params.get("accent") || randomColor();
      const drawing = createDrawing(`${label} sketch`, width, height, accent);
      router.replace(`/draw/${drawing.id}`);
    } catch {
      setError(true);
    }
  }, [params, router]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      {error ? (
        <div>
          <h1 className="font-display text-2xl font-semibold">Could not create the canvas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browser storage is unavailable or full. Free a little site data and try again.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to dashboard
          </button>
        </div>
      ) : <CreatingSpinner />}
    </div>
  );
}

function CreatingCanvas() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <CreatingSpinner />
    </div>
  );
}

function CreatingSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
      className="size-8 rounded-full border-2 border-primary border-t-transparent"
      aria-label="Creating canvas"
    />
  );
}
