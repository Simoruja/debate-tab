"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Move3d } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { useReducedMotion, useWebGL } from "./use-webgl";
import type { SeasonRound } from "./season-tower-scene";

const SeasonTowerScene = dynamic(() => import("./season-tower-scene"), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse rounded-xl bg-cream/5" />,
});

const RESULT_LABEL: Record<SeasonRound["result"], string> = {
  win: "Won",
  loss: "Lost",
  pending: "Result pending",
};

/**
 * A participant's tournament as a 3D stack: one slab per round, round 1 at
 * the bottom. Wins are gold, losses slate, upcoming rounds glass. Tap a slab
 * to pull it out and see the matchup.
 */
export function SeasonTower({ rounds }: { rounds: SeasonRound[] }) {
  const webgl = useWebGL();
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<number | null>(null);
  if (rounds.length === 0) return null;

  const wins = rounds.filter((r) => r.result === "win").length;
  const losses = rounds.filter((r) => r.result === "loss").length;
  const current = selected !== null ? rounds[selected] : null;

  const select = (i: number) => {
    haptic.select();
    setSelected((prev) => (prev === i ? null : i));
  };

  return (
    <div className="relative mb-8 overflow-hidden rounded-xl bg-navy text-cream shadow-lg">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 60% at 40% 45%, rgba(196,144,48,0.18), transparent 70%)",
        }}
      />
      <div className="relative flex items-center justify-between px-5 pt-4">
        <div>
          <span className="eyebrow">Your season</span>
          <p className="mt-1 font-serif text-2xl font-semibold lining-nums">
            {wins}W <span className="text-cream/40">–</span> {losses}L
          </p>
        </div>
        {webgl && (
          <span className="flex items-center gap-1 text-[11px] text-cream/50">
            <Move3d className="size-3.5" /> Drag · tap a round
          </span>
        )}
      </div>

      {webgl ? (
        <div className="relative h-[260px] touch-pan-y sm:h-[300px]">
          <SeasonTowerScene
            rounds={rounds}
            selected={selected}
            onSelect={select}
            reducedMotion={reducedMotion}
          />
        </div>
      ) : (
        <ol className="relative flex gap-2 px-5 py-4">
          {rounds.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => select(i)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ring-1 ${
                  r.result === "win"
                    ? "bg-gold text-navy ring-gold"
                    : r.result === "loss"
                      ? "bg-cream/10 ring-cream/20"
                      : "ring-cream/20 ring-dashed"
                }`}
              >
                {r.round}
              </button>
            </li>
          ))}
        </ol>
      )}

      <div
        className="relative min-h-12 border-t border-cream/10 px-5 py-3 text-sm"
        aria-live="polite"
      >
        {current ? (
          <p>
            <span className="font-medium text-gold">{current.round}</span>
            <span className="text-cream/60"> · {current.side} vs </span>
            {current.opponent}
            <span className="text-cream/60">
              {" "}
              · {RESULT_LABEL[current.result]}
            </span>
          </p>
        ) : (
          <p className="text-cream/50">
            Gold slabs are wins, dark slabs are losses, and glass ones are still
            to be decided.
          </p>
        )}
      </div>
      {/* Keyboard and screen-reader access to the same rounds. */}
      <div className="sr-only">
        {rounds.map((r, i) => (
          <button key={r.id} type="button" onClick={() => select(i)}>
            {r.round}: {r.side} vs {r.opponent}, {RESULT_LABEL[r.result]}
          </button>
        ))}
      </div>
    </div>
  );
}
