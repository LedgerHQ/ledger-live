import {
  getQrElementFrame,
  INK,
  NEVER_PRESSED,
  SKELETON,
  toRgbString,
  type QrElement,
} from "./animationTimeline";

const CORNER_DOT: QrElement = { x: 0.05, y: 0.05, kind: "dot" };
const CENTER_DOT: QrElement = { x: 0.5, y: 0.5, kind: "dot" };
const MIDDLE_DOT: QrElement = { x: 0.7, y: 0.5, kind: "dot" };
const CENTER: QrElement = { x: 0.5, y: 0.5, kind: "center" };
const FINDER: QrElement = { x: 0.1, y: 0.1, kind: "finder" };

describe("loading", () => {
  it("shows the skeleton when the clock is stopped, as with reduced motion", () => {
    expect(getQrElementFrame("loading", 0, CENTER_DOT, NEVER_PRESSED)).toEqual({
      scale: 1,
      color: SKELETON,
    });
    expect(getQrElementFrame("loading", 0, CORNER_DOT, NEVER_PRESSED).color).toEqual(SKELETON);
  });

  it("sweeps a lighter band out from the center", () => {
    // Early in a sweep the band sits near the center, not on the corners.
    const center = getQrElementFrame("loading", 0.25, CENTER_DOT, NEVER_PRESSED);
    const corner = getQrElementFrame("loading", 0.25, CORNER_DOT, NEVER_PRESSED);

    expect(center.color.r).toBeGreaterThan(SKELETON.r);
    expect(corner.color).toEqual(SKELETON);
  });

  it("repeats the sweep and never shows the code", () => {
    for (let time = 0; time < 30; time += 0.37) {
      const { color, scale } = getQrElementFrame("loading", time, CORNER_DOT, NEVER_PRESSED);
      expect(scale).toBe(1);
      expect(color.r).toBeGreaterThanOrEqual(SKELETON.r);
    }
    expect(getQrElementFrame("loading", 1.2 + 0.25, CENTER_DOT, NEVER_PRESSED)).toEqual(
      getQrElementFrame("loading", 0.25, CENTER_DOT, NEVER_PRESSED),
    );
  });

  it("ignores presses", () => {
    expect(getQrElementFrame("loading", 1.3, MIDDLE_DOT, 1)).toEqual(
      getQrElementFrame("loading", 1.3, MIDDLE_DOT, NEVER_PRESSED),
    );
  });
});

describe("copy", () => {
  const PRESSED_AT = 1;

  it("stays still before any press", () => {
    expect(getQrElementFrame("copy", 2, MIDDLE_DOT, NEVER_PRESSED)).toEqual({
      scale: 1,
      color: INK,
    });
    expect(getQrElementFrame("copy", 2, CENTER, NEVER_PRESSED).scale).toBe(1);
  });

  it("does not change any color", () => {
    expect(getQrElementFrame("copy", 1.3, MIDDLE_DOT, PRESSED_AT).color).toEqual(INK);
  });

  it("pops the center badge right after the press", () => {
    expect(getQrElementFrame("copy", 1.15, CENTER, PRESSED_AT).scale).toBeGreaterThan(1.1);
    expect(getQrElementFrame("copy", 1.5, CENTER, PRESSED_AT).scale).toBe(1);
  });

  it("grows the dots on the ripple as it leaves the center", () => {
    // MIDDLE_DOT is 0.2 from the center: the ripple reaches it about 0.2 s after the press.
    expect(getQrElementFrame("copy", 1.05, MIDDLE_DOT, PRESSED_AT).scale).toBe(1);
    expect(getQrElementFrame("copy", 1.33, MIDDLE_DOT, PRESSED_AT).scale).toBeGreaterThan(1.3);
    expect(getQrElementFrame("copy", 1.33, CORNER_DOT, PRESSED_AT).scale).toBe(1);
    expect(getQrElementFrame("copy", 2.2, MIDDLE_DOT, PRESSED_AT).scale).toBe(1);
  });

  it("leaves the finders still", () => {
    expect(getQrElementFrame("copy", 1.3, FINDER, PRESSED_AT).scale).toBe(1);
  });

  it("ignores a press stored in the future", () => {
    expect(getQrElementFrame("copy", 1, CENTER, 2).scale).toBe(1);
  });
});

describe("toRgbString", () => {
  it("rounds each channel", () => {
    expect(toRgbString({ r: 17.4, g: 233.6, b: 0 })).toBe("rgb(17,234,0)");
  });
});
