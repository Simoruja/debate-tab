"use client";

/**
 * Thin wrapper around the Vibration API. Support is Android Chrome/Firefox
 * only (iOS Safari never implemented it) — every call is a no-op there, so
 * this is pure progressive enhancement and safe to call unconditionally.
 */
type HapticPattern = number | number[];

const PATTERNS = {
  tap: 8,
  select: 15,
  success: [12, 40, 12],
  warning: [20, 30, 20, 30, 20],
  error: [30, 50, 30],
} as const satisfies Record<string, HapticPattern>;

export type HapticKind = keyof typeof PATTERNS;

function fire(pattern: HapticPattern) {
  if (typeof window === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw when called outside a user gesture; ignore.
  }
}

export const haptic: Record<HapticKind, () => void> = {
  tap: () => fire(PATTERNS.tap),
  select: () => fire(PATTERNS.select),
  success: () => fire(PATTERNS.success),
  warning: () => fire(PATTERNS.warning),
  error: () => fire(PATTERNS.error),
};
