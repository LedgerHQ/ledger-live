import {
  computeChartRangeChangePercentage,
  getChartRangeVariation,
  isChartDerivedPriceChangeRange,
} from "../chartRangeVariation";

describe("isChartDerivedPriceChangeRange", () => {
  it("marks the all-time range as chart-derived", () => {
    expect(isChartDerivedPriceChangeRange("all")).toBe(true);
    expect(isChartDerivedPriceChangeRange("1y")).toBe(false);
  });
});

describe("getChartRangeVariation", () => {
  it("derives percent points and fiat delta from the first and last chart prices", () => {
    expect(getChartRangeVariation([100, 150])).toEqual({
      percentage: 50,
      variationFiat: 50,
    });
  });

  it("returns undefined when the series is too short", () => {
    expect(getChartRangeVariation([100])).toBeUndefined();
    expect(getChartRangeVariation([])).toBeUndefined();
  });

  it("falls back to a zero percentage when the first price is zero", () => {
    expect(getChartRangeVariation([0, 25])).toEqual({
      percentage: 0,
      variationFiat: 25,
    });
  });
});

describe("computeChartRangeChangePercentage", () => {
  it("returns the percentage from getChartRangeVariation", () => {
    expect(computeChartRangeChangePercentage([100, 150])).toBe(50);
  });
});
