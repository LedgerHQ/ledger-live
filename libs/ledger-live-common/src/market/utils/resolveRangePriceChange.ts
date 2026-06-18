import { KeysPriceChange } from "./types";
import { getChartRangeVariation, isChartDerivedPriceChangeRange } from "./chartRangeVariation";
import { getPriceChangeKeyForRange } from "./rangePriceChangeKey";

export const DAY_CHANGE_PERCENT_NEAR_ZERO_EPSILON = 0.01;

export type RangePriceChange = Readonly<{
  percentage: number | null | undefined;
  variationFiat: number | undefined;
}>;

/** Implied fiat delta from current spot price and a percent change (e.g. 24h %) in percent points. */
export function getFiatPriceVariationFromPercentChange(
  price?: number,
  dayPercentage?: number | null,
): number | undefined {
  if (price == null || dayPercentage == null) return undefined;
  const denominator = 1 + dayPercentage / 100;
  if (denominator === 0) return undefined;
  const previousPrice = price / denominator;
  const variation = price - previousPrice;
  if (Number.isNaN(variation)) return undefined;
  return variation;
}

export function clampDayChangePercentPointsNearZero(
  dayPercentage: number | null | undefined,
  epsilon = DAY_CHANGE_PERCENT_NEAR_ZERO_EPSILON,
): number | null | undefined {
  if (dayPercentage == null) return dayPercentage;
  return Math.abs(dayPercentage) < epsilon ? 0 : dayPercentage;
}

export function resolveRangePriceChange(options: {
  selectedRange: string;
  chartPrices: readonly number[];
  price?: number;
  priceChangePercentage?: Record<KeysPriceChange, number>;
  priceChangeKeyExtensions?: Partial<Record<string, KeysPriceChange>>;
}): RangePriceChange {
  const { selectedRange, chartPrices, price, priceChangePercentage, priceChangeKeyExtensions } =
    options;

  if (isChartDerivedPriceChangeRange(selectedRange)) {
    const derived = getChartRangeVariation(chartPrices);
    if (derived == null) return { percentage: undefined, variationFiat: undefined };
    return {
      percentage: clampDayChangePercentPointsNearZero(derived.percentage),
      variationFiat: derived.variationFiat,
    };
  }

  const key = getPriceChangeKeyForRange(selectedRange, priceChangeKeyExtensions);
  const percentage = clampDayChangePercentPointsNearZero(
    key == null ? undefined : priceChangePercentage?.[key],
  );
  return {
    percentage,
    variationFiat: getFiatPriceVariationFromPercentChange(price, percentage),
  };
}
