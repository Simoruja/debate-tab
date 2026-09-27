"use client";

import { useState, type ReactNode } from "react";
import { cn } from "cn";
import { haptic } from "@/lib/haptics";

/**
 * A card that flips over in 3D on tap/click/Enter to show its back face.
 * Both faces share one grid cell so the card sizes to the taller face.
 */
export function FlipCard({
  front,
  back,
  label,
  className,
}: {
  front: ReactNode;
  back: ReactNode;
  label: string;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={cn("[perspective:1200px]", className)}>
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={`${label}: ${flipped ? "show matchup" : "show result"}`}
        onClick={() => {
          haptic.select();
          setFlipped((f) => !f);
        }}
        className={cn(
          "grid h-full w-full text-left [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:duration-0",
          "rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        <div
          className="[grid-area:1/1] [backface-visibility:hidden]"
          aria-hidden={flipped}
        >
          {front}
        </div>
        <div
          className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          aria-hidden={!flipped}
        >
          {back}
        </div>
      </button>
    </div>
  );
}
