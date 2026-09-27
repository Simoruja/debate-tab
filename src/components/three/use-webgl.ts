"use client";

import { useSyncExternalStore } from "react";

function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

let cached: boolean | null = null;
const subscribe = () => () => {};

/** `true` once on the client with a usable WebGL context; `false` during SSR. */
export function useWebGL() {
  return useSyncExternalStore(
    subscribe,
    () => (cached ??= detectWebGL()),
    () => false,
  );
}

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
