import { getQrElementFrame, PRESS_END, toRgbString, type QrElement } from "./animationTimeline";
import { FINDER_MODULES, type QrMatrix } from "./qrMatrix";
import type { QrAnimation } from "./types";

// Same geometry as the native views (ios/AnimatedQrCodeView.swift, android/.../AnimatedQrCodeView.kt).
const DOT_RADIUS_RATIO = 0.42;
const FINDER_RING_RADIUS_MODULES = 2.5;
const FULL_TURN = Math.PI * 2;

type QrCanvasContext = Pick<
  CanvasRenderingContext2D,
  | "arc"
  | "arcTo"
  | "beginPath"
  | "clearRect"
  | "closePath"
  | "fill"
  | "moveTo"
  | "stroke"
  | "fillStyle"
  | "strokeStyle"
  | "lineWidth"
>;

export type QrCanvasFrame = Readonly<{
  matrix: QrMatrix;
  /** Side of the code, in CSS pixels. */
  size: number;
  animation: QrAnimation;
  /** Seconds, on the clock of `pressedAt`. */
  time: number;
  pressedAt: number;
}>;

function roundedRect(
  ctx: QrCanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/** Draws one frame of the code: the dots, then the three finders. */
export function drawAnimatedQrFrame(
  ctx: QrCanvasContext,
  { matrix, size, animation, time, pressedAt }: QrCanvasFrame,
) {
  ctx.clearRect(0, 0, size, size);
  const count = matrix.moduleCount;
  if (count <= FINDER_MODULES) return;
  const moduleSize = size / count;
  const center = (index: number) => (index + 0.5) / count;

  for (const { row, col } of matrix.dots) {
    const element: QrElement = { x: center(col), y: center(row), kind: "dot" };
    const { scale, color } = getQrElementFrame(animation, time, element, pressedAt);
    ctx.fillStyle = toRgbString(color);
    ctx.beginPath();
    ctx.arc(
      (col + 0.5) * moduleSize,
      (row + 0.5) * moduleSize,
      moduleSize * DOT_RADIUS_RATIO * scale,
      0,
      FULL_TURN,
    );
    ctx.fill();
  }

  const finderEdge = count - FINDER_MODULES;
  const finderOffset = (FINDER_MODULES - 1) / 2;
  const finderSide = FINDER_MODULES * moduleSize;
  for (const [row, col] of [
    [0, 0],
    [0, finderEdge],
    [finderEdge, 0],
  ]) {
    const element: QrElement = {
      x: center(col + finderOffset),
      y: center(row + finderOffset),
      kind: "finder",
    };
    const ink = toRgbString(getQrElementFrame(animation, time, element, pressedAt).color);
    const x = col * moduleSize;
    const y = row * moduleSize;
    // A canvas stroke straddles its path: the ring's path runs half a module inside the finder.
    ctx.strokeStyle = ink;
    ctx.lineWidth = moduleSize;
    ctx.beginPath();
    roundedRect(
      ctx,
      x + moduleSize / 2,
      y + moduleSize / 2,
      finderSide - moduleSize,
      finderSide - moduleSize,
      moduleSize * FINDER_RING_RADIUS_MODULES - moduleSize / 2,
    );
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.beginPath();
    roundedRect(
      ctx,
      x + 2 * moduleSize,
      y + 2 * moduleSize,
      3 * moduleSize,
      3 * moduleSize,
      moduleSize,
    );
    ctx.fill();
  }
}

/** Whether the code still moves at `time`: the shimmer always, a press until its ripple ends. */
export function isQrMoving(animation: QrAnimation, time: number, pressedAt: number): boolean {
  if (animation === "loading") return true;
  return pressedAt >= 0 && time - pressedAt < PRESS_END;
}
