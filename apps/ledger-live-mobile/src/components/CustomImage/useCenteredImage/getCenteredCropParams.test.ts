import { getCenteredCropParams } from "./getCenteredCropParams";

describe("getCenteredCropParams", () => {
  it("returns the correct crop params when the image is bigger than the container", () => {
    expect(getCenteredCropParams({ width: 200, height: 100 }, { width: 100, height: 100 })).toEqual(
      {
        width: 100,
        height: 100,
        originX: 50,
        originY: 0,
      },
    );
  });

  it("returns the correct crop params when the image is taller than the container", () => {
    expect(getCenteredCropParams({ width: 100, height: 200 }, { width: 100, height: 100 })).toEqual(
      {
        width: 100,
        height: 100,
        originX: 0,
        originY: 50,
      },
    );
  });

  it("returns the correct crop params when the image is taller and wider than the container", () => {
    expect(getCenteredCropParams({ width: 300, height: 200 }, { width: 100, height: 100 })).toEqual(
      {
        width: 100,
        height: 100,
        originX: 100,
        originY: 50,
      },
    );
  });

  it("returns the correct crop params when the image is the same size as the container", () => {
    expect(getCenteredCropParams({ width: 100, height: 100 }, { width: 100, height: 100 })).toEqual(
      {
        width: 100,
        height: 100,
        originX: 0,
        originY: 0,
      },
    );
  });

  it("throws if the cropping dimensions don't fit in the image dimensions", () => {
    expect(() =>
      getCenteredCropParams({ width: 700, height: 669 }, { width: 400, height: 670 }),
    ).toThrow();
    expect(() =>
      getCenteredCropParams({ width: 399, height: 670 }, { width: 400, height: 670 }),
    ).toThrow();
    expect(() =>
      getCenteredCropParams({ width: 399, height: 669 }, { width: 400, height: 670 }),
    ).toThrow();
  });
});
