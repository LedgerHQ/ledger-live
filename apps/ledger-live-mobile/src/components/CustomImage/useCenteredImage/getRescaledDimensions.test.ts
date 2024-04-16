import { getRescaledDimensions } from "./getRescaledDimensions";

describe("getRescaledDimensions", () => {
  // Image exactly fits the container
  it("returns identical dimensions when image exactly fits the container", () => {
    const imageDimensions = { width: 100, height: 100 };
    const containerDimensions = { width: 100, height: 100 };
    const result = getRescaledDimensions(imageDimensions, containerDimensions);
    expect(result).toEqual({ width: 100, height: 100 });
  });

  it("returns identical dimensions when image has the same aspect ratio as the container", () => {
    const imageDimensions = { width: 10, height: 10 };
    const containerDimensions = { width: 100, height: 100 };
    const result = getRescaledDimensions(imageDimensions, containerDimensions);
    expect(result).toEqual({
      width: 100,
      height: 100,
    });
  });

  it("scales down the image when the image has a wider aspect ratio than the container and requires a scale down", () => {
    // scaling down
    const imageDimensions = { width: 300, height: 200 };
    const containerDimensions = { width: 100, height: 100 };
    const result = getRescaledDimensions(imageDimensions, containerDimensions);
    expect(result).toEqual({
      width: 150,
      height: 100, // height should be matched to the container
    });
  });

  it("scales up the image when the image has a wider aspect ratio than the container and requires a scale up", () => {
    // scaling up
    const imageDimensions = { width: 50, height: 20 };
    const containerDimensions = { width: 100, height: 100 };
    const result = getRescaledDimensions(imageDimensions, containerDimensions);
    expect(result).toEqual({
      width: 250,
      height: 100, // height should be matched to the container
    });
  });

  it("scales down the image when the image has a taller aspect ratio than the container and requires a scale down", () => {
    // scaling down
    const imageDimensions = { width: 200, height: 300 };
    const containerDimensions = { width: 100, height: 100 };
    const result = getRescaledDimensions(imageDimensions, containerDimensions);
    expect(result).toEqual({
      width: 100, // width should be matched to the container
      height: 150,
    });
  });

  it("scales up the image when the image has a taller aspect ratio than the container and requires a scale up", () => {
    // scaling up
    const imageDimensions = { width: 20, height: 50 };
    const containerDimensions = { width: 100, height: 100 };
    const result = getRescaledDimensions(imageDimensions, containerDimensions);
    expect(result).toEqual({
      width: 100, // width should be matched to the container
      height: 250,
    });
  });

  // we had a crash because of some rounding errors on a cat picture with dimensions, because of rounding error
  it("handles any cat picture (no rounding error)", () => {
    expect(
      getRescaledDimensions({ width: 1362, height: 1302 }, { width: 400, height: 670 }),
    ).toEqual({
      width: 700,
      height: 670,
    });

    expect(
      getRescaledDimensions({ width: 1302, height: 1362 }, { width: 670, height: 400 }),
    ).toEqual({
      width: 670,
      height: 700,
    });
  });

  // Zero dimensions
  it("handles zero dimensions gracefully", () => {
    const square100px = { width: 100, height: 100 };
    expect(getRescaledDimensions({ ...square100px, width: 0 }, square100px)).toEqual({
      width: 0,
      height: 0,
    });
    expect(getRescaledDimensions({ ...square100px, height: 0 }, square100px)).toEqual({
      width: 0,
      height: 0,
    });
    expect(getRescaledDimensions(square100px, { ...square100px, width: 0 })).toEqual({
      width: 0,
      height: 0,
    });
    expect(getRescaledDimensions(square100px, { ...square100px, height: 0 })).toEqual({
      width: 0,
      height: 0,
    });
  });

  it("always returns a result that satisfies the properties of object-fit:contain", () => {
    function generateRandomDimensions(maxSize: number) {
      return {
        height: Math.floor(Math.random() * maxSize + 1),
        width: Math.floor(Math.random() * maxSize + 1),
      };
    }
    function generateNRandomDimensionsPairs(n: number, maxSize: number) {
      return Array.from({ length: n }).map(() => [
        generateRandomDimensions(maxSize),
        generateRandomDimensions(maxSize),
      ]);
    }
    const testCases = generateNRandomDimensionsPairs(2000, 100);
    testCases.forEach(([imageDimensions, containerDimensions]) => {
      const result = getRescaledDimensions(imageDimensions, containerDimensions);
      expect(result.width).toBeGreaterThanOrEqual(containerDimensions.width);
      expect(result.height).toBeGreaterThanOrEqual(containerDimensions.height);
      expect(
        result.width === containerDimensions.width || result.height === containerDimensions.height,
      ).toBe(true);
    });
  });
});
