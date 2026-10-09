"use client";

import { useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Edges, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import { MathUtils } from "three";
import { Anchor, Label, type LabelRegistry } from "./labels";
import { CREAM, GOLD } from "./scales";

export type SeasonRound = {
  id: string;
  round: string;
  result: "win" | "loss" | "pending";
  side: "Gov" | "Opp";
  opponent: string;
};

const SLAB_H = 0.26;
const GAP = 0.08;
const STEP = SLAB_H + GAP;
const LOSS = "#3a4258";

function Slab({
  entry,
  index,
  selected,
  onSelect,
  labels,
  reducedMotion,
}: {
  entry: SeasonRound;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
  labels: LabelRegistry;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const targetY = SLAB_H / 2 + index * STEP;
  // Slabs drop in from above one after another, bottom (round 1) first.
  const t = useRef(reducedMotion ? 1 : -index * 0.18);

  useFrame((_, delta) => {
    if (!group.current) return;
    t.current = Math.min(1, t.current + delta * 1.6);
    const p = Math.max(0, t.current);
    const drop = (1 - p) * (1 - p) * 3;
    group.current.position.y = targetY + drop;
    group.current.position.x = MathUtils.damp(
      group.current.position.x,
      selected ? 0.55 : hovered ? 0.18 : 0,
      10,
      delta,
    );
    const s = selected ? 1.04 : 1;
    group.current.scale.setScalar(
      MathUtils.damp(group.current.scale.x, s, 10, delta),
    );
  });

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect(index);
  };

  let body: ReactNode;
  if (entry.result === "pending") {
    body = (
      <meshStandardMaterial
        color={CREAM}
        transparent
        opacity={0.12}
        depthWrite={false}
      />
    );
  } else if (entry.result === "win") {
    body = (
      <meshStandardMaterial
        color={GOLD}
        metalness={0.75}
        roughness={0.28}
        emissive={GOLD}
        emissiveIntensity={selected || hovered ? 0.35 : 0.12}
      />
    );
  } else {
    body = (
      <meshStandardMaterial
        color={LOSS}
        roughness={0.7}
        emissive={CREAM}
        emissiveIntensity={selected || hovered ? 0.08 : 0}
      />
    );
  }

  return (
    <group
      ref={group}
      position={[0, targetY, 0]}
      onPointerDown={handleDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, SLAB_H, 1.2]} />
        {body}
        <Edges
          color={entry.result === "pending" ? CREAM : GOLD}
          threshold={15}
          lineWidth={1}
          transparent
          opacity={entry.result === "loss" ? 0.25 : 0.6}
        />
      </mesh>
      <Anchor labelId={entry.id} labels={labels} position={[1.05, 0, 0.6]} />
    </group>
  );
}

function Sway({
  children,
  reducedMotion,
}: {
  children: ReactNode;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current && !reducedMotion) {
      group.current.rotation.y =
        -0.35 + Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });
  return (
    <group ref={group} rotation={[0, -0.35, 0]}>
      {children}
    </group>
  );
}

export default function SeasonTowerScene({
  rounds,
  selected,
  onSelect,
  reducedMotion,
}: {
  rounds: SeasonRound[];
  selected: number | null;
  onSelect: (index: number) => void;
  reducedMotion: boolean;
}) {
  const labels = useRef(new Map<string, HTMLElement>());
  const height = rounds.length * STEP;
  const centerY = Math.max(0.6, height / 2);
  const distance = 4.2 + Math.max(0, height - 1.5) * 0.9;

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0.4, centerY + 1.4, distance], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 6, 4]} intensity={1.5} castShadow />
        <pointLight
          position={[-2.5, centerY, 2]}
          color={GOLD}
          intensity={5}
          distance={7}
        />
        <Sway reducedMotion={reducedMotion}>
          {rounds.map((entry, i) => (
            <Slab
              key={entry.id}
              entry={entry}
              index={i}
              selected={selected === i}
              onSelect={onSelect}
              labels={labels}
              reducedMotion={reducedMotion}
            />
          ))}
        </Sway>
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.5}
          scale={5}
          blur={2.2}
          far={3}
        />
        <OrbitControls
          target={[0, centerY, 0]}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.05}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
          rotateSpeed={0.6}
        />
      </Canvas>

      {rounds.map((entry, i) => (
        <Label key={entry.id} id={entry.id} labels={labels}>
          <span
            className={`ml-[5.5rem] block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 transition-colors ${
              selected === i
                ? "bg-gold text-navy ring-gold"
                : "bg-navy/70 text-cream/85 ring-cream/15"
            }`}
          >
            {entry.round} ·{" "}
            {entry.result === "win" ? "W" : entry.result === "loss" ? "L" : "—"}
          </span>
        </Label>
      ))}
    </div>
  );
}
