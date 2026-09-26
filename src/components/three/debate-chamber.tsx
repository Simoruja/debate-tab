"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Float, Sparkles } from "@react-three/drei";
import { Anchor, Label, type LabelRegistry } from "./labels";
import type { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { MathUtils } from "three";

const GOLD = "#c49030";
const GREEN = "#3d7060";
const NAVY = "#1c2233";
const CREAM = "#f7f4ee";

const BEAM_HALF = 1.1;
const PAN_DROP = 0.75;
const CAMERA_Y = 2.1;

export type Side = "gov" | "opp";

type ChamberProps = {
  weights: Record<Side, number>;
  onCast: (side: Side) => void;
  reducedMotion: boolean;
};

/** Mouse/finger parallax: the camera drifts toward the pointer. */
function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame((state, delta) => {
    if (reducedMotion) return;
    const { camera, pointer } = state;
    camera.position.x = MathUtils.damp(
      camera.position.x,
      pointer.x * 0.9,
      2.5,
      delta,
    );
    camera.position.y = MathUtils.damp(
      camera.position.y,
      CAMERA_Y + pointer.y * 0.5,
      2.5,
      delta,
    );
    camera.lookAt(0, 0.7, 0);
  });
  return null;
}

function Lectern({
  side,
  color,
  position,
  labels,
  onCast,
}: {
  side: Side;
  color: string;
  position: [number, number, number];
  labels: LabelRegistry;
  onCast: (side: Side) => void;
}) {
  const group = useRef<Group>(null);
  const glow = useRef<Mesh<BoxGeometry, MeshStandardMaterial>>(null);
  const pulse = useRef(0);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    pulse.current = Math.max(0, pulse.current - delta * 2.5);
    if (group.current) {
      const s = 1 + pulse.current * 0.12 + (hovered ? 0.04 : 0);
      group.current.scale.setScalar(
        MathUtils.damp(group.current.scale.x, s, 12, delta),
      );
    }
    if (glow.current) {
      const mat = glow.current.material;
      mat.emissiveIntensity = 0.25 + pulse.current * 2 + (hovered ? 0.4 : 0);
    }
  });

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    pulse.current = 1;
    onCast(side);
  };

  return (
    <group
      ref={group}
      position={position}
      rotation={[0, side === "gov" ? 0.45 : -0.45, 0]}
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
      {/* Body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.7, 1.1, 0.45]} />
        <meshStandardMaterial color={NAVY} roughness={0.55} metalness={0.2} />
      </mesh>
      {/* Accent stripe */}
      <mesh ref={glow} position={[0, 0.6, 0.23]}>
        <boxGeometry args={[0.72, 0.12, 0.02]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
        />
      </mesh>
      {/* Slanted reading desk */}
      <mesh position={[0, 1.15, 0.05]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.85, 0.06, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Microphone */}
      <mesh position={[0.22, 1.35, -0.05]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.35]} />
        <meshStandardMaterial color={CREAM} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.22, 1.5, 0.02]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <Anchor labelId={side} labels={labels} position={[0, 1.85, 0]} />
    </group>
  );
}

/** Scales of justice whose beam tips toward the side with more weight. */
function Scales({
  weights,
  reducedMotion,
}: {
  weights: Record<Side, number>;
  reducedMotion: boolean;
}) {
  const beam = useRef<Group>(null);
  const leftPan = useRef<Group>(null);
  const rightPan = useRef<Group>(null);
  const spin = useRef<Group>(null);

  useFrame((state, delta) => {
    const diff = weights.gov - weights.opp;
    // Positive rotation.z lifts the right (+x) end, so the heavier gov side (left) drops.
    const target = MathUtils.clamp(diff * 0.07, -0.38, 0.38);
    if (beam.current) {
      const wobble = reducedMotion
        ? 0
        : Math.sin(state.clock.elapsedTime * 1.3) * 0.015;
      beam.current.rotation.z = MathUtils.damp(
        beam.current.rotation.z,
        target + wobble,
        3,
        delta,
      );
      const a = beam.current.rotation.z;
      leftPan.current?.position.set(
        -BEAM_HALF * Math.cos(a),
        1.9 - BEAM_HALF * Math.sin(a) - PAN_DROP,
        0,
      );
      rightPan.current?.position.set(
        BEAM_HALF * Math.cos(a),
        1.9 + BEAM_HALF * Math.sin(a) - PAN_DROP,
        0,
      );
    }
    if (spin.current && !reducedMotion) spin.current.rotation.y += delta * 0.6;
  });

  const pan = (color: string) => (
    <>
      {/* Chains */}
      {[-0.18, 0.18].map((x) => (
        <mesh
          key={x}
          position={[x / 2, PAN_DROP / 2, 0]}
          rotation={[0, 0, x > 0 ? -0.24 : 0.24]}
        >
          <cylinderGeometry args={[0.008, 0.008, PAN_DROP]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      <mesh castShadow>
        <cylinderGeometry args={[0.32, 0.22, 0.07, 32]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>
    </>
  );

  return (
    <group>
      {/* Pillar */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.09, 1.9, 24]} />
        <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.35, 0.42, 0.1, 32]} />
        <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Finial */}
      <group ref={spin} position={[0, 2.08, 0]}>
        <mesh>
          <octahedronGeometry args={[0.11]} />
          <meshStandardMaterial
            color={CREAM}
            emissive={GOLD}
            emissiveIntensity={0.6}
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>
      </group>
      <group ref={beam} position={[0, 1.9, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, BEAM_HALF * 2, 16]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      <group ref={leftPan}>{pan(GOLD)}</group>
      <group ref={rightPan}>{pan(GREEN)}</group>
    </group>
  );
}

function Stage() {
  return (
    <group>
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[2.7, 2.85, 0.12, 64]} />
        <meshStandardMaterial color="#242b40" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.58, 2.64, 96]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.03, 96]} />
        <meshStandardMaterial color={CREAM} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

export default function DebateChamber({
  weights,
  onCast,
  reducedMotion,
}: ChamberProps) {
  const labels = useRef(new Map<string, HTMLElement>());

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, CAMERA_Y, 6.6], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ camera }) => camera.lookAt(0, 0.7, 0)}
      >
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight
          position={[-2.3, 1.5, 1.5]}
          color={GOLD}
          intensity={6}
          distance={6}
        />
        <pointLight
          position={[2.3, 1.5, 1.5]}
          color={GREEN}
          intensity={6}
          distance={6}
        />

        <Stage />
        <Float
          speed={reducedMotion ? 0 : 1.2}
          rotationIntensity={0.15}
          floatIntensity={0.3}
          floatingRange={[0, 0.12]}
        >
          <Scales weights={weights} reducedMotion={reducedMotion} />
        </Float>
        <Lectern
          side="gov"
          color={GOLD}
          position={[-1.8, 0, 0.5]}
          labels={labels}
          onCast={onCast}
        />
        <Lectern
          side="opp"
          color={GREEN}
          position={[1.8, 0, 0.5]}
          labels={labels}
          onCast={onCast}
        />

        {!reducedMotion && (
          <Sparkles
            count={60}
            scale={[6, 3.5, 4]}
            position={[0, 1.6, 0]}
            size={2.2}
            speed={0.35}
            color={GOLD}
          />
        )}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.5}
          scale={6}
          blur={2.4}
          far={3}
        />
        <CameraRig reducedMotion={reducedMotion} />
      </Canvas>

      {(["gov", "opp"] as const).map((side) => (
        <Label key={side} id={side} labels={labels}>
          <span
            className={`block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-widest ring-1 ${
              side === "gov"
                ? "bg-gold/20 text-gold ring-gold/40"
                : "bg-green-accent/25 text-[#8fc2b0] ring-green-accent/50"
            }`}
          >
            {side === "gov" ? "GOV" : "OPP"} · {weights[side]}
          </span>
        </Label>
      ))}
    </div>
  );
}
