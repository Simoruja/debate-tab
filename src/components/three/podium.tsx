"use client";

import dynamic from "next/dynamic";
import { Move3d } from "lucide-react";
import { useReducedMotion, useWebGL } from "./use-webgl";
import type { PodiumEntry } from "./podium-scene";

const PodiumScene = dynamic(() => import("./podium-scene"), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse rounded-xl bg-cream/5" />,
});

/** Interactive 3D podium for the top three teams. Drag to orbit. */
export function Podium({ entries }: { entries: PodiumEntry[] }) {
  const webgl = useWebGL();
  const reducedMotion = useReducedMotion();
  if (entries.length === 0) return null;

  return (
    <div className="relative mb-8 overflow-hidden rounded-xl bg-navy text-cream shadow-lg ring-1 ring-navy/10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 60% at 50% 30%, rgba(196,144,48,0.22), transparent 70%)",
        }}
      />
      <div className="relative flex items-center justify-between px-5 pt-4">
        <span className="eyebrow">Top of the table</span>
        {webgl && (
          <span className="flex items-center gap-1 text-[11px] text-cream/50">
            <Move3d className="size-3.5" /> Drag to orbit
          </span>
        )}
      </div>
      {webgl ? (
        <div className="relative h-[280px] touch-pan-y sm:h-[340px]">
          <PodiumScene
            entries={entries.slice(0, 3)}
            reducedMotion={reducedMotion}
          />
        </div>
      ) : (
        <ol className="relative grid grid-cols-3 items-end gap-3 px-5 pb-5 pt-6 text-center">
          {[1, 0, 2].map((i) => {
            const e = entries[i];
            if (!e) return <li key={i} />;
            return (
              <li key={e.id}>
                <p className="truncate font-serif font-semibold">{e.name}</p>
                <div
                  className="mt-2 rounded-t-md bg-cream/10 font-serif text-2xl text-gold"
                  style={{ height: [96, 72, 52][i] }}
                >
                  {i + 1}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
