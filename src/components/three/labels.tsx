"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { Vector3, type Group } from "three";

export type LabelRegistry = RefObject<Map<string, HTMLElement>>;

const v = new Vector3();

/**
 * An invisible point in the 3D scene. Every frame, the DOM element
 * registered under the same id is moved to where this point lands on
 * screen. Keeps labels as ordinary DOM in the page's own React tree,
 * rather than a separate React root per label.
 */
export function Anchor({
  labelId,
  labels,
  ...props
}: { labelId: string; labels: LabelRegistry } & ThreeElements["group"]) {
  const group = useRef<Group>(null);

  useFrame(({ camera, size }) => {
    const el = labels.current.get(labelId);
    if (!el || !group.current) return;
    group.current.getWorldPosition(v).project(camera);
    const x = ((v.x + 1) / 2) * size.width;
    const y = ((1 - v.y) / 2) * size.height;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    el.style.opacity = v.z < 1 ? "1" : "0";
  });

  return <group ref={group} {...props} />;
}

/** DOM side of an `Anchor`: absolutely positioned over the canvas. */
export function Label({
  id,
  labels,
  children,
}: {
  id: string;
  labels: LabelRegistry;
  children: ReactNode;
}) {
  return (
    <div
      ref={(el) => {
        if (!el) return;
        labels.current.set(id, el);
        return () => {
          labels.current.delete(id);
        };
      }}
      className="pointer-events-none absolute top-0 left-0 opacity-0 transition-opacity duration-300 select-none"
    >
      {children}
    </div>
  );
}
