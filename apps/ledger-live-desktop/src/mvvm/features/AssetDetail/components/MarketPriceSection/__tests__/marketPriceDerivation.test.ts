import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import {
  clampDayChangePercentPointsNearZero,
  getFiatPriceVariationFromPercentChange,
  getPriceChangeKeyForRange,
  getScrubVariation,
  resolveTrendPercentAndVariant,
} from "../utils/marketPriceDerivation";

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

describe("getScrubVariation", () => {
  it("derives a positive fraction and fiat delta from the range start", () => {
    expect(getScrubVariation(100, 110)).toEqual({ percentage: 0.1, variationFiat: 10 });
  });

  it("derives a negative fraction and fiat delta from the range start", () => {
    expect(getScrubVariation(200, 150)).toEqual({ percentage: -0.25, variationFiat: -50 });
  });

  it("falls back to a zero fraction when the baseline is zero", () => {
    expect(getScrubVariation(0, 25)).toEqual({ percentage: 0, variationFiat: 25 });
  });
});

describe("resolveTrendPercentAndVariant", () => {
  it("emits dash when there is no variation data", () => {
    expect(
      resolveTrendPercentAndVariant({
        hasVariationData: false,
        trendPercentageText: "+1.00%",
        trendVariant: "positive",
      }),
    ).toEqual({ percentageText: "—", variationVariant: "neutral" });
  });

  it("coerces negative zero display to neutral 0.00%", () => {
    expect(
      resolveTrendPercentAndVariant({
        hasVariationData: true,
        trendPercentageText: "-0.00%",
        trendVariant: "negative",
      }),
    ).toEqual({ percentageText: "0.00%", variationVariant: "neutral" });
  });

  it("leaves discreet placeholder unchanged", () => {
    expect(
      resolveTrendPercentAndVariant({
        hasVariationData: true,
        trendPercentageText: "***",
        trendVariant: "neutral",
      }),
    ).toEqual({ percentageText: "***", variationVariant: "neutral" });
  });

  it("passes through trend text and variant when variation data is available", () => {
    expect(
      resolveTrendPercentAndVariant({
        hasVariationData: true,
        trendPercentageText: "+2.50%",
        trendVariant: "positive",
      }),
    ).toEqual({ percentageText: "+2.50%", variationVariant: "positive" });
  });

  it("coerces negative zero with a comma decimal separator to neutral 0.00%", () => {
    expect(
      resolveTrendPercentAndVariant({
        hasVariationData: true,
        trendPercentageText: "-0,00%",
        trendVariant: "negative",
      }),
    ).toEqual({ percentageText: "0.00%", variationVariant: "neutral" });
  });
});

describe("getPriceChangeKeyForRange", () => {
  it("maps each chart range to a price-change key", () => {
    expect(getPriceChangeKeyForRange("1d")).toBe(KeysPriceChange.day);
    expect(getPriceChangeKeyForRange("1w")).toBe(KeysPriceChange.week);
    expect(getPriceChangeKeyForRange("1m")).toBe(KeysPriceChange.month);
    expect(getPriceChangeKeyForRange("1y")).toBe(KeysPriceChange.year);
  });

  it("folds ranges longer than the API's 1y series into the yearly key", () => {
    expect(getPriceChangeKeyForRange("6m")).toBe(KeysPriceChange.year);
    expect(getPriceChangeKeyForRange("5y")).toBe(KeysPriceChange.year);
    expect(getPriceChangeKeyForRange("all")).toBe(KeysPriceChange.year);
  });
});
