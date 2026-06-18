import { KeysPriceChange } from "../types";
import {
  clampDayChangePercentPointsNearZero,
  getFiatPriceVariationFromPercentChange,
  resolveRangePriceChange,
} from "../resolveRangePriceChange";

describe("clampDayChangePercentPointsNearZero", () => {
  it("snaps tiny magnitudes to 0", () => {
    expect(clampDayChangePercentPointsNearZero(0.005)).toBe(0);
    expect(clampDayChangePercentPointsNearZero(-0.009)).toBe(0);
  });

  it("preserves nullish and larger values", () => {
    expect(clampDayChangePercentPointsNearZero(undefined)).toBeUndefined();
    expect(clampDayChangePercentPointsNearZero(1.5)).toBe(1.5);
  });
});

describe("getFiatPriceVariationFromPercentChange", () => {
  it("derives fiat delta from price and percent points", () => {
    const v = getFiatPriceVariationFromPercentChange(110, 10);
    expect(v).toBeCloseTo(10, 5);
  });

  it("returns undefined when inputs are incomplete", () => {
    expect(getFiatPriceVariationFromPercentChange(undefined, 1)).toBeUndefined();
    expect(getFiatPriceVariationFromPercentChange(100, undefined)).toBeUndefined();
  });
});

describe("resolveRangePriceChange", () => {
  it("derives all-time variation from chart endpoints", () => {
    expect(
      resolveRangePriceChange({
        selectedRange: "all",
        chartPrices: [10_000, 40_000],
      }),
    ).toEqual({ percentage: 300, variationFiat: 30_000 });
  });

  it("uses market API percentages for standard ranges", () => {
    const result = resolveRangePriceChange({
      selectedRange: "1d",
      chartPrices: [],
      price: 110,
      priceChangePercentage: {
        [KeysPriceChange.hour]: 0,
        [KeysPriceChange.day]: 10,
        [KeysPriceChange.week]: 0,
        [KeysPriceChange.month]: 0,
        [KeysPriceChange.sixMonths]: 0,
        [KeysPriceChange.year]: 0,
      },
    });
    expect(result.percentage).toBe(10);
    expect(result.variationFiat).toBeCloseTo(10, 5);
  });

  it("applies platform-specific price-change key extensions", () => {
    const result = resolveRangePriceChange({
      selectedRange: "6m",
      chartPrices: [],
      price: 110,
      priceChangePercentage: {
        [KeysPriceChange.hour]: 0,
        [KeysPriceChange.day]: 0,
        [KeysPriceChange.week]: 0,
        [KeysPriceChange.month]: 0,
        [KeysPriceChange.sixMonths]: 5,
        [KeysPriceChange.year]: 0,
      },
      priceChangeKeyExtensions: { "6m": KeysPriceChange.sixMonths },
    });
    expect(result.percentage).toBe(5);
    expect(result.variationFiat).toBeCloseTo(5.238, 2);
  });
});
