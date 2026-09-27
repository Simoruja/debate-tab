"use client";

import dynamic from "next/dynamic";
import { useReducedMotion, useWebGL } from "./use-webgl";
import type { BallotSide } from "./ballot-balance-scene";

const BallotBalanceScene = dynamic(() => import("./ballot-balance-scene"), {
  ssr: false,
  loading: () => <div className="h-full" />,
});

/**
 * Live 3D balance for the ballot: the beam tips toward whichever side has
 * more speaker points, the picked winner gets a ring, and the base pulses
 * red on a low-point win. Purely visual — the numbers are also in the form.
 */
export function BallotBalance({
  govTotal,
  oppTotal,
  winner,
  lowPointWin,
}: {
  govTotal: number;
  oppTotal: number;
  winner: BallotSide | null;
  lowPointWin: boolean;
}) {
  const webgl = useWebGL();
  const reducedMotion = useReducedMotion();
  if (!webgl) return null;

  const diff = govTotal - oppTotal;
  const caption =
    diff === 0
      ? "Points are level"
      : `${diff > 0 ? "Government" : "Opposition"} ahead by ${Math.abs(diff)}`;

  return (
    <div className="relative overflow-hidden rounded-lg border bg-muted/40">
      <div className="h-44 sm:h-52" aria-hidden>
        <BallotBalanceScene
          govTotal={govTotal}
          oppTotal={oppTotal}
          winner={winner}
          lowPointWin={lowPointWin}
          reducedMotion={reducedMotion}
        />
      </div>
      <p
        className={`absolute inset-x-0 bottom-2 text-center text-xs font-medium ${
          lowPointWin ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {lowPointWin ? "Low-point win — the scales disagree" : caption}
      </p>
    </div>
  );
}
