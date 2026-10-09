"use client";

import { useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sparkles } from "@react-three/drei";
import { Anchor, Label, type LabelRegistry } from "./labels";
import type { Group, Mesh } from "three";

export type PodiumEntry = {
  id: string;
  name: string;
  wins: number;
  speakerScore: number;
};

const GOLD = "#c49030";
const SILVER = "#b8bcc6";
const BRONZE = "#a8763f";

// Display order left → right is 2nd, 1st, 3rd.
const SLOTS = [
  { rank: 2, x: -1.45, height: 1.05, color: SILVER },
  { rank: 1, x: 0, height: 1.55, color: GOLD },
  { rank: 3, x: 1.45, height: 0.75, color: BRONZE },
] as const;

function Step({
  rank,
  x,
  height,
  color,
  delay,
  reducedMotion,
  labels,
  hovered,
  onHover,
}: {
  rank: number;
  x: number;
  height: number;
  color: string;
  delay: number;
  reducedMotion: boolean;
  labels: LabelRegistry;
  hovered: boolean;
  onHover: (rank: number | null) => void;
}) {
  const block = useRef<Mesh>(null);
  const top = useRef<Group>(null);
  const trophy = useRef<Group>(null);
  const t = useRef(reducedMotion ? 1 : -delay);

  useFrame((state, delta) => {
    t.current = Math.min(1, t.current + delta * 0.9);
    // Ease-out-back so each step "pops" up out of the floor.
    const p = Math.max(0, t.current);
    const c = 1.4;
    const eased =
      p === 0 ? 0 : 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
    const h = Math.max(0.001, height * eased);
    if (block.current) {
      block.current.scale.y = h;
      block.current.position.y = h / 2;
    }
    if (top.current) top.current.position.y = h;
    if (trophy.current) {
      if (!reducedMotion)
        trophy.current.rotation.y += delta * (hovered ? 2.4 : 0.7);
      trophy.current.position.y =
        0.3 +
        (reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 2 + x) * 0.05);
    }
  });

  return (
    <group
      position={[x, 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(rank);
      }}
      onPointerOut={() => onHover(null)}
    >
      <mesh ref={block} castShadow receiveShadow>
        <boxGeometry args={[1.25, 1, 1.25]} />
        <meshStandardMaterial
          color="#242b40"
          emissive={color}
          emissiveIntensity={hovered ? 0.18 : 0.04}
          roughness={0.6}
        />
      </mesh>
      <group ref={top}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[1.3, 0.04, 1.3]} />
          <meshStandardMaterial
            color={color}
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>
        <group ref={trophy}>
          {rank === 1 ? (
            <mesh castShadow>
              <torusKnotGeometry args={[0.13, 0.045, 96, 12]} />
              <meshStandardMaterial
                color={color}
                metalness={0.95}
                roughness={0.15}
                emissive={color}
                emissiveIntensity={0.25}
              />
            </mesh>
          ) : (
            <mesh castShadow>
              <icosahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial
                color={color}
                metalness={0.9}
                roughness={0.2}
                flatShading
              />
            </mesh>
          )}
        </group>
        <Anchor
          labelId={`name-${rank}`}
          labels={labels}
          position={[0, 0.95, 0]}
        />
      </group>
      <Anchor
        labelId={`num-${rank}`}
        labels={labels}
        position={[0, 0.3, 0.64]}
      />
    </group>
  );
}

export default function PodiumScene({
  entries,
  reducedMotion,
}: {
  entries: PodiumEntry[];
  reducedMotion: boolean;
}) {
  const labels = useRef(new Map<string, HTMLElement>());
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 2.4, 5.4], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[2, 6, 4]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <spotLight
          position={[0, 5, 1]}
          angle={0.4}
          penumbra={0.8}
          intensity={30}
          color={GOLD}
        />

        <Sway reducedMotion={reducedMotion}>
          {SLOTS.map((slot, i) => {
            const entry = entries[slot.rank - 1];
            if (!entry) return null;
            return (
              <Step
                key={entry.id}
                rank={slot.rank}
                x={slot.x}
                height={slot.height}
                color={slot.color}
                delay={i * 0.25}
                reducedMotion={reducedMotion}
                labels={labels}
                hovered={hovered === slot.rank}
                onHover={setHovered}
              />
            );
          })}
        </Sway>

        {!reducedMotion && (
          <Sparkles
            count={40}
            scale={[5, 3, 2]}
            position={[0, 2, 0]}
            size={2.5}
            speed={0.4}
            color={GOLD}
          />
        )}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.55}
          scale={8}
          blur={2.2}
          far={3}
        />
        <OrbitControls
          target={[0, 0.9, 0]}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.1}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          rotateSpeed={0.6}
        />
      </Canvas>

      {SLOTS.map((slot) => {
        const entry = entries[slot.rank - 1];
        if (!entry) return null;
        return (
          <div key={entry.id}>
            <Label id={`name-${slot.rank}`} labels={labels}>
              <div
                className={`w-36 text-center transition-transform duration-300 ${
                  hovered === slot.rank ? "scale-110" : ""
                }`}
              >
                <p className="truncate font-serif text-base font-semibold text-cream drop-shadow">
                  {entry.name}
                </p>
                <p className="text-[11px] uppercase tracking-widest text-cream/70">
                  {entry.wins}W · {entry.speakerScore} spk
                </p>
              </div>
            </Label>
            <Label id={`num-${slot.rank}`} labels={labels}>
              <span
                className="font-serif text-3xl font-semibold lining-nums"
                style={{ color: slot.color }}
              >
                {slot.rank}
              </span>
            </Label>
          </div>
        );
      })}
    </div>
  );
}

/** Gentle idle sway so the podium reads as 3D before anyone drags it. */
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
        Math.sin(state.clock.elapsedTime * 0.35) * 0.18;
    }
  });
  return <group ref={group}>{children}</group>;
}
