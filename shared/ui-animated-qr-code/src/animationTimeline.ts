import type { QrAnimation } from "./types";

// Mirrored in ios/QrAnimationTimeline.swift and android/.../QrAnimationTimeline.kt:
// change the three together so both platforms play the same animation.

export type QrElementKind = "dot" | "finder" | "center";

/** Center of the element, in fractions of the QR side (0 to 1). */
export type QrElement = Readonly<{ x: number; y: number; kind: QrElementKind }>;

/** The `pressedAt` of a code never pressed. */
export const NEVER_PRESSED = -1;

export type QrRgb = Readonly<{ r: number; g: number; b: number }>;

export type QrElementFrame = Readonly<{
  scale: number;
  color: QrRgb;
}>;

export const INK: QrRgb = { r: 0x11, g: 0x11, b: 0x11 };
export const SKELETON: QrRgb = { r: 0xe9, g: 0xe9, b: 0xe9 };
const SHIMMER: QrRgb = { r: 0xf7, g: 0xf7, b: 0xf7 };

const SHIMMER_BAND = 0.3;
const SHIMMER_SWEEP = 1.2;

const CENTER_POP = 0.35;
const CENTER_POP_SCALE = 0.18;
const RIPPLE_DELAY = 0.1;
const RIPPLE_SWEEP = 0.9;
const RIPPLE_BAND = 0.12;
const RIPPLE_SCALE = 0.4;
// Center to a corner, in fractions of the side.
const RIPPLE_REACH = Math.SQRT1_2;

function clamp01(x: number): number {
  "worklet";
  return Math.min(1, Math.max(0, x));
}

function smoothstep(x: number): number {
  "worklet";
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
}

function mix(from: QrRgb, to: QrRgb, amount: number): QrRgb {
  "worklet";
  return {
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  };
}

/** 1 when `value` sits on `position`, 0 once it is `width` away. */
function band(value: number, position: number, width: number): number {
  "worklet";
  return smoothstep(1 - Math.abs(value - position) / width);
}

function distanceToCenter({ x, y }: QrElement): number {
  "worklet";
  return Math.hypot(x - 0.5, y - 0.5);
}

function loadingFrame(time: number, element: QrElement): QrElementFrame {
  "worklet";
  const sweep = (time % SHIMMER_SWEEP) / SHIMMER_SWEEP;
  const position = sweep * (1 + 2 * SHIMMER_BAND) - SHIMMER_BAND;
  const shine = band(distanceToCenter(element) / RIPPLE_REACH, position, SHIMMER_BAND);
  return { scale: 1, color: mix(SKELETON, SHIMMER, shine) };
}

function rippleFrame(time: number, element: QrElement, pressedAt: number): QrElementFrame {
  "worklet";
  const age = time - pressedAt;
  if (pressedAt < 0 || age < 0 || element.kind === "finder") return { scale: 1, color: INK };
  if (element.kind === "center") {
    const pop = age < CENTER_POP ? Math.sin((Math.PI * age) / CENTER_POP) : 0;
    return { scale: 1 + CENTER_POP_SCALE * pop, color: INK };
  }
  const progress = (age - RIPPLE_DELAY) / RIPPLE_SWEEP;
  if (progress < 0 || progress > 1) return { scale: 1, color: INK };
  const position = progress * (RIPPLE_REACH + RIPPLE_BAND);
  const grow = band(distanceToCenter(element), position, RIPPLE_BAND);
  return { scale: 1 + RIPPLE_SCALE * grow, color: INK };
}

/** State of one QR element at `time` seconds, for a code last pressed at `pressedAt`. */
export function getQrElementFrame(
  animation: QrAnimation,
  time: number,
  element: QrElement,
  pressedAt: number,
): QrElementFrame {
  "worklet";
  if (animation === "loading") return loadingFrame(time, element);
  return rippleFrame(time, element, pressedAt);
}

export function toRgbString({ r, g, b }: QrRgb): string {
  "worklet";
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}
