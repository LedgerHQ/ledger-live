import {
  ACCENT,
  getAutoTouch,
  getQrElementFrame,
  getShimmerReveal,
  INK,
  NO_TOUCH,
  SKELETON,
  type QrElement,
} from "./animationTimeline";

const TOP_LEFT_DOT: QrElement = { x: 0.05, y: 0.05, kind: "dot" };
const MIDDLE_DOT: QrElement = { x: 0.7, y: 0.5, kind: "dot" };
const CENTER: QrElement = { x: 0.5, y: 0.5, kind: "center" };
const FINDER: QrElement = { x: 0.1, y: 0.1, kind: "finder" };

describe("shimmer", () => {
  it("shows the skeleton while loading", () => {
    const { color, scale } = getQrElementFrame("shimmer", 1, TOP_LEFT_DOT, NO_TOUCH);

    expect(scale).toBe(1);
    expect(color.r).toBeGreaterThanOrEqual(SKELETON.r);
  });

  it("fades the code in at the end of the loading", () => {
    expect(getShimmerReveal(4)).toBe(0);
    expect(getShimmerReveal(5)).toBeGreaterThan(0);
    expect(getShimmerReveal(5)).toBeLessThan(1);
    expect(getShimmerReveal(6)).toBe(1);
    expect(getQrElementFrame("shimmer", 6, TOP_LEFT_DOT, NO_TOUCH).color).toEqual(INK);
    expect(getQrElementFrame("shimmer", 6, CENTER, NO_TOUCH).color).toEqual(ACCENT);
  });

  it("sweeps the shimmer out from the center", () => {
    // Early in a sweep the band sits near the center, not on the corners.
    const center = getQrElementFrame("shimmer", 0.25, { x: 0.5, y: 0.5, kind: "dot" }, NO_TOUCH);
    const corner = getQrElementFrame("shimmer", 0.25, TOP_LEFT_DOT, NO_TOUCH);

    expect(center.color.r).toBeGreaterThan(SKELETON.r);
    expect(corner.color).toEqual(SKELETON);
  });

  it("loops for the benchmark", () => {
    expect(getShimmerReveal(7.2 + 1)).toBe(0);
  });
});

describe("copy", () => {
  const pressed = { x: 0.5, y: 0.5, pressedAt: 1, releasedAt: 1.1 };

  it("does not change any colour", () => {
    expect(getQrElementFrame("copy", 1.5, MIDDLE_DOT, pressed).color).toEqual(INK);
  });

  it("pops the center badge right after the press", () => {
    expect(getQrElementFrame("copy", 1.15, CENTER, pressed).scale).toBeGreaterThan(1);
    expect(getQrElementFrame("copy", 1.5, CENTER, pressed).scale).toBe(1);
  });

  it("grows the dots on the ripple as it leaves the center", () => {
    // MIDDLE_DOT is 0.2 from the center: the ripple reaches it about 0.2 s after the press.
    expect(getQrElementFrame("copy", 1.33, MIDDLE_DOT, pressed).scale).toBeGreaterThan(1.3);
    expect(getQrElementFrame("copy", 1.9, MIDDLE_DOT, pressed).scale).toBe(1);
  });

  it("leaves the finders still", () => {
    expect(getQrElementFrame("copy", 1.3, FINDER, pressed).scale).toBe(1);
  });
});

describe("hover", () => {
  it("grows the dots under the finger", () => {
    const held = { x: 0.05, y: 0.05, pressedAt: 0, releasedAt: -1 };

    expect(getQrElementFrame("hover", 2, TOP_LEFT_DOT, held).scale).toBeCloseTo(1.8);
    expect(getQrElementFrame("hover", 2, MIDDLE_DOT, held).scale).toBe(1);
  });

  it("shrinks them back once the finger is lifted", () => {
    const released = { x: 0.05, y: 0.05, pressedAt: 0, releasedAt: 2 };

    expect(getQrElementFrame("hover", 2.1, TOP_LEFT_DOT, released).scale).toBeGreaterThan(1);
    expect(getQrElementFrame("hover", 2.3, TOP_LEFT_DOT, released).scale).toBe(1);
  });

  it("stays still before any touch", () => {
    expect(getQrElementFrame("hover", 2, TOP_LEFT_DOT, NO_TOUCH).scale).toBe(1);
  });
});

describe("getAutoTouch", () => {
  it("taps the center every 1.6 s for copy", () => {
    const first = getAutoTouch("copy", 3, NO_TOUCH);

    expect(first).toEqual({ x: 0.5, y: 0.5, pressedAt: 3, releasedAt: 3 });
    expect(getAutoTouch("copy", 4, first)).toBe(first);
    expect(getAutoTouch("copy", 4.7, first).pressedAt).toBe(4.7);
  });

  it("holds a press for 0.8 s every 1.6 s for hover", () => {
    const first = getAutoTouch("hover", 3, NO_TOUCH);

    expect(first.pressedAt).toBe(3);
    expect(first.releasedAt).toBeCloseTo(3.8);
    expect(getAutoTouch("hover", 4, first)).toBe(first);
  });

  it("grows the dots under an auto hold until it ends", () => {
    const hold = { x: 0.05, y: 0.05, pressedAt: 3, releasedAt: 3.8 };

    expect(getQrElementFrame("hover", 3.5, TOP_LEFT_DOT, hold).scale).toBeCloseTo(1.8);
    expect(getQrElementFrame("hover", 4.2, TOP_LEFT_DOT, hold).scale).toBe(1);
  });

  it("never presses for shimmer", () => {
    expect(getAutoTouch("shimmer", 3, NO_TOUCH)).toBe(NO_TOUCH);
  });
});
