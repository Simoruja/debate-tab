"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import type { Group } from "three";
import { Anchor, Label } from "./labels";
import { GOLD, GREEN, Scales, tiltFor } from "./scales";

export type BallotSide = "GOVERNMENT" | "OPPOSITION";

export type BallotBalanceProps = {
  govTotal: number;
  oppTotal: number;
  winner: BallotSide | null;
  lowPointWin: boolean;
  reducedMotion: boolean;
};

/** A small spinning laurel ring that sits in the winning side's pan. */
function WinnerRing({ reducedMotion }: { reducedMotion: boolean }) {
  const ring = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!ring.current || reducedMotion) return;
    ring.current.rotation.y += delta * 1.5;
    ring.current.position.y =
      0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.03;
  });
  return (
    <group ref={ring} position={[0, 0.2, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.035, 12, 40]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

export default function BallotBalanceScene({
  govTotal,
  oppTotal,
  winner,
  lowPointWin,
  reducedMotion,
}: BallotBalanceProps) {
  const labels = useRef(new Map<string, HTMLElement>());

  const slot = (side: BallotSide) => (
    <>
      {winner === side && <WinnerRing reducedMotion={reducedMotion} />}
      <Anchor labelId={side} labels={labels} position={[0, -0.22, 0]} />
    </>
  );

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 1.4, 4.3], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ camera }) => camera.lookAt(0, 1.05, 0)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 3]} intensity={1.4} />
        <pointLight
          position={[-2, 1.5, 1.5]}
          color={GREEN}
          intensity={4}
          distance={5}
        />
        <pointLight
          position={[2, 1.5, 1.5]}
          color={GOLD}
          intensity={4}
          distance={5}
        />
        <Scales
          // Speaker points move in ones, so a lighter per-point tilt keeps the
          // beam readable across typical 45–60 point totals.
          tilt={tiltFor(govTotal - oppTotal, 0.05)}
          leftColor={GREEN}
          rightColor={GOLD}
          reducedMotion={reducedMotion}
          alert={lowPointWin}
          leftSlot={slot("GOVERNMENT")}
          rightSlot={slot("OPPOSITION")}
        />
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.35}
          scale={4}
          blur={2}
          far={2}
        />
      </Canvas>

      {(["GOVERNMENT", "OPPOSITION"] as const).map((side) => {
        const total = side === "GOVERNMENT" ? govTotal : oppTotal;
        const isGov = side === "GOVERNMENT";
        return (
          <Label key={side} id={side} labels={labels}>
            <span
              className={`block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums tracking-wider ring-1 ${
                isGov
                  ? "bg-green-accent/15 text-green-accent ring-green-accent/40"
                  : "bg-gold/15 text-gold ring-gold/40"
              } ${winner === side ? "ring-2" : ""}`}
            >
              {isGov ? "GOV" : "OPP"} {total}
              {winner === side ? " ✓" : ""}
            </span>
          </Label>
        );
      })}
    </div>
  );
}
