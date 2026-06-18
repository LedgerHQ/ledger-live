import { getScrubVariation } from "../scrubVariation";

describe("getScrubVariation", () => {
  it("derives a positive fraction and fiat delta from the range start by default", () => {
    expect(getScrubVariation(100, 110)).toEqual({ percentage: 0.1, variationFiat: 10 });
  });

  it("derives percent points when requested", () => {
    expect(getScrubVariation(100, 110, { percentageUnit: "percentPoints" })).toEqual({
      percentage: 10,
      variationFiat: 10,
    });
  });

  it("derives a negative fraction and fiat delta from the range start", () => {
    expect(getScrubVariation(200, 150)).toEqual({ percentage: -0.25, variationFiat: -50 });
  });

  it("falls back to a zero ratio when the baseline is zero", () => {
    expect(getScrubVariation(0, 25)).toEqual({ percentage: 0, variationFiat: 25 });
    expect(getScrubVariation(0, 25, { percentageUnit: "percentPoints" })).toEqual({
      percentage: 0,
      variationFiat: 25,
    });
  });
});
