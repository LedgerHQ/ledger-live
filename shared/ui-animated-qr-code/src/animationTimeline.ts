import type { QrAnimation } from "./types";

// Mirrored in ios/QrAnimationTimeline.swift and android/.../QrAnimationTimeline.kt:
// change the three together so the benchmark compares like for like.

export type QrElementKind = "dot" | "finder" | "center";

/** Center of the element, in fractions of the QR side (0 to 1). */
export type QrElement = Readonly<{ x: number; y: number; kind: QrElementKind }>;

/**
 * The finger on the code: position in fractions of the QR side, and the times (s) it went down
 * and up. `pressedAt` < 0: never pressed. `releasedAt` < 0: still down.
 */
export type QrTouch = Readonly<{ x: number; y: number; pressedAt: number; releasedAt: number }>;

export const NO_TOUCH: QrTouch = { x: 0, y: 0, pressedAt: -1, releasedAt: -1 };

export type QrRgb = Readonly<{ r: number; g: number; b: number }>;

export type QrElementFrame = Readonly<{
  scale: number;
  color: QrRgb;
}>;

export const INK: QrRgb = { r: 0x11, g: 0x11, b: 0x11 };
export const ACCENT: QrRgb = { r: 0x27, g: 0x75, b: 0xca };
export const SKELETON: QrRgb = { r: 0xe9, g: 0xe9, b: 0xe9 };
const SHIMMER: QrRgb = { r: 0xf7, g: 0xf7, b: 0xf7 };

const SHIMMER_BAND = 0.3;
const SHIMMER_SWEEP = 1.2;
// The fade-in ends the loading; the hold and the way back only loop it for the benchmark.
const LOADING_END = 4.8;
const FADE_IN_END = 5.2;
const HOLD_END = 6.7;
const SHIMMER_PERIOD = 7.2;

const CENTER_POP = 0.35;
const CENTER_POP_SCALE = 0.18;
const RIPPLE_DELAY = 0.1;
const RIPPLE_SWEEP = 0.9;
const RIPPLE_BAND = 0.12;
const RIPPLE_SCALE = 0.4;
// Center to a corner, in fractions of the side.
const RIPPLE_REACH = Math.SQRT1_2;
const AUTO_PRESS_PERIOD = 1.6;
const AUTO_HOLD = 0.8;

const HOVER_RADIUS = 0.14;
const HOVER_SCALE = 0.8;
const HOVER_RELEASE = 0.25;

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

/** How far the shimmer has turned into the real code: 0 while loading, 1 once faded in. */
export function getShimmerReveal(time: number): number {
  "worklet";
  const local = time % SHIMMER_PERIOD;
  if (local < LOADING_END) return 0;
  if (local < FADE_IN_END) return smoothstep((local - LOADING_END) / (FADE_IN_END - LOADING_END));
  if (local < HOLD_END) return 1;
  return 1 - smoothstep((local - HOLD_END) / (SHIMMER_PERIOD - HOLD_END));
}

function shimmerFrame(time: number, { x, y, kind }: QrElement): QrElementFrame {
  "worklet";
  const local = time % SHIMMER_PERIOD;
  if (local < LOADING_END) {
    const sweep = (local % SHIMMER_SWEEP) / SHIMMER_SWEEP;
    const position = sweep * (1 + 2 * SHIMMER_BAND) - SHIMMER_BAND;
    return {
      scale: 1,
      color: mix(
        SKELETON,
        SHIMMER,
        band(Math.hypot(x - 0.5, y - 0.5) / RIPPLE_REACH, position, SHIMMER_BAND),
      ),
    };
  }
  const loaded = kind === "center" ? ACCENT : INK;
  return { scale: 1, color: mix(SKELETON, loaded, getShimmerReveal(time)) };
}

function copyFrame(time: number, { x, y, kind }: QrElement, touch: QrTouch): QrElementFrame {
  "worklet";
  const color = kind === "center" ? ACCENT : INK;
  const age = time - touch.pressedAt;
  if (touch.pressedAt < 0 || age < 0) return { scale: 1, color };
  if (kind === "center") {
    const pop = age < CENTER_POP ? Math.sin((Math.PI * age) / CENTER_POP) : 0;
    return { scale: 1 + CENTER_POP_SCALE * pop, color };
  }
  if (kind === "finder") return { scale: 1, color };
  const progress = (age - RIPPLE_DELAY) / RIPPLE_SWEEP;
  if (progress < 0 || progress > 1) return { scale: 1, color };
  const position = progress * (RIPPLE_REACH + RIPPLE_BAND);
  const distance = Math.hypot(x - 0.5, y - 0.5);
  return { scale: 1 + RIPPLE_SCALE * band(distance, position, RIPPLE_BAND), color };
}

function hoverFrame(time: number, { x, y, kind }: QrElement, touch: QrTouch): QrElementFrame {
  "worklet";
  const color = kind === "center" ? ACCENT : INK;
  if (kind !== "dot" || touch.pressedAt < 0) return { scale: 1, color };
  const held = touch.releasedAt < 0 ? 1 : 1 - smoothstep((time - touch.releasedAt) / HOVER_RELEASE);
  const near = smoothstep(1 - Math.hypot(x - touch.x, y - touch.y) / HOVER_RADIUS);
  return { scale: 1 + HOVER_SCALE * near * held, color };
}

/** State of one QR element at `time` seconds. */
export function getQrElementFrame(
  animation: QrAnimation,
  time: number,
  element: QrElement,
  touch: QrTouch,
): QrElementFrame {
  "worklet";
  if (animation === "shimmer") return shimmerFrame(time, element);
  if (animation === "copy") return copyFrame(time, element, touch);
  return hoverFrame(time, element, touch);
}

/**
 * With auto play on, a press every 1.6 s: a tap in the center for `copy`, a 0.8 s hold somewhere
 * on the code for `hover`. A release time in the future means the finger is still down.
 */
export function getAutoTouch(animation: QrAnimation, time: number, touch: QrTouch): QrTouch {
  "worklet";
  if (animation === "shimmer") return touch;
  const due = touch.pressedAt < 0 || time - touch.pressedAt >= AUTO_PRESS_PERIOD;
  if (!due) return touch;
  if (animation === "copy") return { x: 0.5, y: 0.5, pressedAt: time, releasedAt: time };
  return {
    x: 0.5 + 0.3 * Math.sin(time * 2.3),
    y: 0.5 + 0.3 * Math.sin(time * 1.7 + 0.7),
    pressedAt: time,
    releasedAt: time + AUTO_HOLD,
  };
}

export function toRgbString({ r, g, b }: QrRgb): string {
  "worklet";
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}
