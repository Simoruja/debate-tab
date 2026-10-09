"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { useReducedMotion, useWebGL } from "./use-webgl";
import type { Side } from "./debate-chamber";

const DebateChamber = dynamic(() => import("./debate-chamber"), {
  ssr: false,
  loading: () => <ChamberPlaceholder />,
});

function ChamberPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="size-24 animate-pulse rounded-full bg-gold/10 ring-1 ring-gold/30" />
    </div>
  );
}

/**
 * Interactive 3D debate chamber for the landing hero. Tapping a lectern
 * "casts weight" for that side and the scales of justice tip toward it.
 */
export function HeroChamber() {
  const webgl = useWebGL();
  const reducedMotion = useReducedMotion();
  const [weights, setWeights] = useState<Record<Side, number>>({
    gov: 0,
    opp: 0,
  });

  const onCast = useCallback((side: Side) => {
    haptic.select();
    setWeights((w) => ({ ...w, [side]: w[side] + 1 }));
  }, []);

  const total = weights.gov + weights.opp;
  const govPct = total === 0 ? 50 : Math.round((weights.gov / total) * 100);
  const verdict =
    total === 0
      ? "Tap a lectern to weigh in"
      : weights.gov === weights.opp
        ? "Dead even — the house is split"
        : weights.gov > weights.opp
          ? "The Government is carrying the room"
          : "The Opposition is carrying the room";

  return (
    <div className="relative h-[320px] w-full sm:h-[400px] lg:h-[460px]">
      {webgl ? (
        <DebateChamber
          weights={weights}
          onCast={onCast}
          reducedMotion={reducedMotion}
        />
      ) : (
        <ChamberPlaceholder />
      )}

      {webgl && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-1">
          <p
            className="text-xs font-medium tracking-wide text-cream/80 [text-shadow:0_1px_6px_rgb(0_0_0/0.8)]"
            aria-live="polite"
          >
            {verdict}
          </p>
          <div className="pointer-events-auto flex w-full max-w-xs items-center gap-2">
            <div
              className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-cream/10"
              role="meter"
              aria-label="Government share of the room"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={govPct}
            >
              <div
                className="bg-green-accent transition-[width] duration-500"
                style={{ width: `${govPct}%` }}
              />
              <div className="flex-1 bg-gold" />
            </div>
            <button
              type="button"
              onClick={() => {
                haptic.tap();
                setWeights({ gov: 0, opp: 0 });
              }}
              disabled={total === 0}
              className="rounded-full p-1 text-cream/60 transition hover:text-cream disabled:opacity-30"
              aria-label="Reset the scales"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
          {/* Keyboard/screen-reader access to the same interaction. */}
          <div className="sr-only">
            <button type="button" onClick={() => onCast("gov")}>
              Weigh in for Government
            </button>
            <button type="button" onClick={() => onCast("opp")}>
              Weigh in for Opposition
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
