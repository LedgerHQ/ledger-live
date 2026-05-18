import type { Unit } from "@ledgerhq/types-cryptoassets";
import {
  clampDayChangePercentPointsNearZero,
  formatSignedFiatVariation,
  getFiatPriceVariationFromPercentChange,
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

describe("formatSignedFiatVariation", () => {
  const usdUnit: Unit = {
    name: "US Dollar",
    code: "USD",
    magnitude: 2,
    showAllDigits: true,
    prefixCode: true,
  };

  it("uses formatCurrencyUnit with sign for non-zero values", () => {
    expect(formatSignedFiatVariation(120, usdUnit, "en-US")).toBe("+USD1.20");
    expect(formatSignedFiatVariation(-346, usdUnit, "en-US")).toBe("-USD3.46");
  });

  it("omits leading plus when variation is zero", () => {
    expect(formatSignedFiatVariation(0, usdUnit, "en-US")).toBe("USD0.00");
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
