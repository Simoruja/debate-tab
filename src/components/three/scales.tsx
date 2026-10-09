"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { Color, MathUtils } from "three";

export const GOLD = "#c49030";
export const GREEN = "#3d7060";
export const NAVY = "#1c2233";
export const CREAM = "#f7f4ee";
const ALERT = "#d9534f";

const BEAM_HALF = 1.1;
const PAN_DROP = 0.75;
const BEAM_Y = 1.9;
const MAX_TILT = 0.38;

/**
 * Turns a signed weight difference (left minus right) into a beam angle.
 * Positive tilts the left pan down.
 */
export function tiltFor(diff: number, perUnit = 0.07) {
  return MathUtils.clamp(diff * perUnit, -MAX_TILT, MAX_TILT);
}

function Pan({ color, children }: { color: string; children?: ReactNode }) {
  return (
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
      {children}
    </>
  );
}

/**
 * Scales of justice. The beam eases toward `tilt` radians (positive drops the
 * left pan) and the pans hang level from its ends. `leftSlot`/`rightSlot`
 * render inside each pan, so anything placed there rides along with it.
 */
export function Scales({
  tilt,
  leftColor,
  rightColor,
  reducedMotion,
  alert = false,
  leftSlot,
  rightSlot,
}: {
  tilt: number;
  leftColor: string;
  rightColor: string;
  reducedMotion: boolean;
  alert?: boolean;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}) {
  const beam = useRef<Group>(null);
  const leftPan = useRef<Group>(null);
  const rightPan = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const base = useRef<Mesh>(null);
  const alertColor = useRef(new Color(ALERT));
  const calmColor = useRef(new Color(GOLD));

  useFrame((state, delta) => {
    if (beam.current) {
      const wobble = reducedMotion
        ? 0
        : Math.sin(state.clock.elapsedTime * 1.3) * 0.015;
      beam.current.rotation.z = MathUtils.damp(
        beam.current.rotation.z,
        tilt + wobble,
        3,
        delta,
      );
      const a = beam.current.rotation.z;
      leftPan.current?.position.set(
        -BEAM_HALF * Math.cos(a),
        BEAM_Y - BEAM_HALF * Math.sin(a) - PAN_DROP,
        0,
      );
      rightPan.current?.position.set(
        BEAM_HALF * Math.cos(a),
        BEAM_Y + BEAM_HALF * Math.sin(a) - PAN_DROP,
        0,
      );
    }
    if (spin.current && !reducedMotion) spin.current.rotation.y += delta * 0.6;
    if (base.current) {
      const mat = base.current.material as MeshStandardMaterial;
      const pulse = alert
        ? 0.6 +
          (reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 6) * 0.4)
        : 0.15;
      mat.emissive.lerp(alert ? alertColor.current : calmColor.current, 0.2);
      mat.emissiveIntensity = MathUtils.damp(
        mat.emissiveIntensity,
        pulse,
        8,
        delta,
      );
    }
  });

  return (
    <group>
      {/* Pillar */}
      <mesh position={[0, BEAM_Y / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.09, BEAM_Y, 24]} />
        <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh ref={base} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.35, 0.42, 0.1, 32]} />
        <meshStandardMaterial
          color={GOLD}
          metalness={0.85}
          roughness={0.3}
          emissive={GOLD}
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Finial */}
      <group ref={spin} position={[0, BEAM_Y + 0.18, 0]}>
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
      <group ref={beam} position={[0, BEAM_Y, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, BEAM_HALF * 2, 16]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      <group ref={leftPan}>
        <Pan color={leftColor}>{leftSlot}</Pan>
      </group>
      <group ref={rightPan}>
        <Pan color={rightColor}>{rightSlot}</Pan>
      </group>
    </group>
  );
}
