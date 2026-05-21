export const DAY_CHANGE_PERCENT_NEAR_ZERO_EPSILON = 0.01;

export type TrendVariant = "positive" | "negative" | "neutral";

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

export function resolveTrendPercentAndVariant(options: {
  hasVariationData: boolean;
  trendPercentageText: string;
  trendVariant: TrendVariant;
}): { percentageText: string; variationVariant: TrendVariant } {
  const { hasVariationData, trendPercentageText, trendVariant } = options;
  if (!hasVariationData) {
    return { percentageText: "—", variationVariant: "neutral" };
  }
  const isNegativeZero =
    trendPercentageText !== "***" && /^-0[.,]00%$/.test(trendPercentageText.trim());
  if (isNegativeZero) {
    return { percentageText: "0.00%", variationVariant: "neutral" };
  }
  return { percentageText: trendPercentageText, variationVariant: trendVariant };
}
