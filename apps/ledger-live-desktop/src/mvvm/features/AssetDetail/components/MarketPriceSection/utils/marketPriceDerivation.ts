import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import type { LineChartRange } from "LLD/components/LineChart";

export const DAY_CHANGE_PERCENT_NEAR_ZERO_EPSILON = 0.01;

export type TrendVariant = "positive" | "negative" | "neutral";

const RANGE_TO_PRICE_CHANGE_KEY: Record<LineChartRange, KeysPriceChange> = {
  "1d": KeysPriceChange.day,
  "1w": KeysPriceChange.week,
  "1m": KeysPriceChange.month,
  "6m": KeysPriceChange.year,
  "1y": KeysPriceChange.year,
  "5y": KeysPriceChange.year,
  all: KeysPriceChange.year,
};

export function getPriceChangeKeyForRange(range: LineChartRange): KeysPriceChange {
  return RANGE_TO_PRICE_CHANGE_KEY[range];
}

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

/**
 * Variation between the start of the selected range and a scrubbed point.
 * `percentage` is a fraction (e.g. 0.05 = +5%); `variationFiat` is the raw delta.
 */
export function getScrubVariation(
  baselinePrice: number,
  scrubbedPrice: number,
): { percentage: number; variationFiat: number } {
  const variationFiat = scrubbedPrice - baselinePrice;
  const percentage = baselinePrice !== 0 ? variationFiat / baselinePrice : 0;
  return { percentage, variationFiat };
}

export function resolveTrendPercentAndVariant(options: {
  hasVariationData: boolean;
  trendPercentageText: string;
  trendVariant: TrendVariant;
}): { percentageText: string; variationVariant: TrendVariant } {
  const { hasVariationData, trendPercentageText, trendVariant } = options;
  if (hasVariationData) {
    const isNegativeZero =
      trendPercentageText !== "***" && /^-0[.,]00%$/.test(trendPercentageText.trim());
    if (isNegativeZero) {
      return { percentageText: "0.00%", variationVariant: "neutral" };
    }
    return { percentageText: trendPercentageText, variationVariant: trendVariant };
  }
  return { percentageText: "—", variationVariant: "neutral" };
}
