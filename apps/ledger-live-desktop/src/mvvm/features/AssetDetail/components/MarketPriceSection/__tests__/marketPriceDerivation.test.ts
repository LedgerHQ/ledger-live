import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import {
  getPriceChangeKeyForRange,
  resolveTrendPercentAndVariant,
} from "../utils/marketPriceDerivation";

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
  it("extends the shared base mapping with desktop-only ranges", () => {
    expect(getPriceChangeKeyForRange("6m")).toBe(KeysPriceChange.sixMonths);
    expect(getPriceChangeKeyForRange("5y")).toBe(KeysPriceChange.year);
  });

  it("returns undefined for chart-derived ranges", () => {
    expect(getPriceChangeKeyForRange("all")).toBeUndefined();
  });
});
