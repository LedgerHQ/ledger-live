import { getAnimationBoxSize, getAnimationSize, stateAnimations, type StateAnimation } from ".";

describe("getAnimationSize", () => {
  it("should render a canvas the size of the spot at the spot size", () => {
    expect(getAnimationSize("loading", 96)).toEqual({ width: 96, height: 96 });
  });

  it("should scale a larger canvas with the spot, so that the spot keeps its size", () => {
    const bluetooth = getAnimationSize("bluetooth", 96);
    expect(bluetooth.width).toBeCloseTo(110.67, 2);
    expect(bluetooth.height).toBeCloseTo(110.67, 2);
    expect(getAnimationSize("usb", 72)).toEqual({ width: 72, height: 78 });
  });
});

describe("getAnimationBoxSize", () => {
  it("should be the size of the largest canvas, so that every animation fits", () => {
    const boxSize = getAnimationBoxSize(96);

    expect(boxSize).toBeCloseTo(110.67, 2);
    for (const animation of Object.keys(stateAnimations) as StateAnimation[]) {
      const { width, height } = getAnimationSize(animation, 96);
      expect(width).toBeLessThanOrEqual(boxSize);
      expect(height).toBeLessThanOrEqual(boxSize);
    }
  });
});
