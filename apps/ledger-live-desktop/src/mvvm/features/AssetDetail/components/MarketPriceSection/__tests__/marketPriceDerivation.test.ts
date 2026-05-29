import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import {
  clampDayChangePercentPointsNearZero,
  getFiatPriceVariationFromPercentChange,
  getPriceChangeKeyForRange,
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
});

describe("getPriceChangeKeyForRange", () => {
  it("maps each chart range to a price-change key", () => {
    expect(getPriceChangeKeyForRange("1d")).toBe(KeysPriceChange.day);
    expect(getPriceChangeKeyForRange("1w")).toBe(KeysPriceChange.week);
    expect(getPriceChangeKeyForRange("1m")).toBe(KeysPriceChange.month);
    expect(getPriceChangeKeyForRange("1y")).toBe(KeysPriceChange.year);
  });

  it("folds longer ranges into the yearly key (the broadest series available)", () => {
    expect(getPriceChangeKeyForRange("all")).toBe(KeysPriceChange.year);
  });
});
