import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";

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

/** Signed countervalue string using the same fiat options as the spot price; no leading '+' when the amount is zero. */
export function formatSignedFiatVariation(value: number, unit: Unit, locale: string): string {
  const bn = new BigNumber(value);
  const base = {
    locale,
    showCode: true,
    disableRounding: true,
    showAllDigits: true,
  } as const;
  if (bn.isZero()) {
    return formatCurrencyUnit(unit, bn, base);
  }
  return formatCurrencyUnit(unit, bn, { ...base, alwaysShowSign: true });
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
