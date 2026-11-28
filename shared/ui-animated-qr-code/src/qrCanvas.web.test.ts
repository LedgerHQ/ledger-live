import { TextEncoder } from "node:util";
import { INK, NEVER_PRESSED, toRgbString } from "./animationTimeline";

// jsdom has no Encoding API: qrcode encodes the value with it.
globalThis.TextEncoder ??= TextEncoder as typeof globalThis.TextEncoder;
import { createQrMatrix } from "./qrMatrix";
import { drawAnimatedQrFrame, isQrMoving } from "./qrCanvas";

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const SIZE = 208;

function recordingContext() {
  const dots: { x: number; y: number; radius: number; color: string }[] = [];
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    arcTo: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn((x: number, y: number, radius: number) => {
      dots.push({ x, y, radius, color: String(ctx.fillStyle) });
    }),
  };
  return { ctx, dots };
}

describe("drawAnimatedQrFrame", () => {
  const matrix = createQrMatrix(ADDRESS, true);

  it("should draw every dark module in ink, and the three finders, when still", () => {
    const { ctx, dots } = recordingContext();

    drawAnimatedQrFrame(ctx, {
      matrix,
      size: SIZE,
      animation: "ripple",
      time: 0,
      pressedAt: NEVER_PRESSED,
    });

    expect(dots).toHaveLength(matrix.dots.length);
    expect(new Set(dots.map(dot => dot.color))).toEqual(new Set([toRgbString(INK)]));
    expect(ctx.stroke).toHaveBeenCalledTimes(3);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, SIZE, SIZE);
  });

  it("should keep the center clear for its content", () => {
    const { ctx, dots } = recordingContext();
    const moduleSize = SIZE / matrix.moduleCount;
    const clearFrom = matrix.clearStart * moduleSize;
    const clearTo = (matrix.clearStart + matrix.clearCount) * moduleSize;

    drawAnimatedQrFrame(ctx, {
      matrix,
      size: SIZE,
      animation: "ripple",
      time: 0,
      pressedAt: NEVER_PRESSED,
    });

    const inCenter = dots.filter(
      ({ x, y }) => x > clearFrom && x < clearTo && y > clearFrom && y < clearTo,
    );
    expect(inCenter).toEqual([]);
  });

  it("should draw the skeleton in gray while loading", () => {
    const { ctx, dots } = recordingContext();

    drawAnimatedQrFrame(ctx, {
      matrix,
      size: SIZE,
      animation: "loading",
      time: 0,
      pressedAt: NEVER_PRESSED,
    });

    expect(dots.some(dot => dot.color === toRgbString(INK))).toBe(false);
  });

  it("should grow some dots while a press ripples out", () => {
    const still = recordingContext();
    const rippling = recordingContext();
    const frame = { matrix, size: SIZE, animation: "ripple" as const, pressedAt: 10 };

    drawAnimatedQrFrame(still.ctx, { ...frame, time: 9 });
    drawAnimatedQrFrame(rippling.ctx, { ...frame, time: 10.5 });

    const baseRadius = Math.max(...still.dots.map(dot => dot.radius));
    expect(rippling.dots.some(dot => dot.radius > baseRadius)).toBe(true);
  });
});

describe("isQrMoving", () => {
  it("should keep the shimmer moving while loading", () => {
    expect(isQrMoving("loading", 100, NEVER_PRESSED)).toBe(true);
  });

  it("should stop once a press has played", () => {
    expect(isQrMoving("ripple", 10.2, 10)).toBe(true);
    expect(isQrMoving("ripple", 12, 10)).toBe(false);
    expect(isQrMoving("ripple", 12, NEVER_PRESSED)).toBe(false);
  });
});
