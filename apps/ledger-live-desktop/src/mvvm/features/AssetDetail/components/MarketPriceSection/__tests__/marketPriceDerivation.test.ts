import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import {
  resolveRangePriceChange,
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

describe("resolveRangePriceChange", () => {
  const priceChangePercentage: Record<KeysPriceChange, number> = {
    [KeysPriceChange.hour]: 1,
    [KeysPriceChange.day]: 2,
    [KeysPriceChange.week]: 3,
    [KeysPriceChange.month]: 4,
    [KeysPriceChange.sixMonths]: 25,
    [KeysPriceChange.year]: 100,
  };

  it("reads the six months price change for the 6m range", () => {
    expect(
      resolveRangePriceChange({
        selectedRange: "6m",
        chartPrices: [],
        price: 125,
        priceChangePercentage,
      }),
    ).toEqual({ percentage: 25, variationFiat: 25 });
  });

  it("reads the one year price change for the 5y range", () => {
    expect(
      resolveRangePriceChange({
        selectedRange: "5y",
        chartPrices: [],
        price: 200,
        priceChangePercentage,
      }),
    ).toEqual({ percentage: 100, variationFiat: 100 });
  });

  it("derives the all range from the chart prices instead of the market price changes", () => {
    expect(
      resolveRangePriceChange({
        selectedRange: "all",
        chartPrices: [100, 150],
        price: 200,
        priceChangePercentage,
      }),
    ).toEqual({ percentage: 50, variationFiat: 50 });
  });
});
