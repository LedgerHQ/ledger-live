import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { getPriceChangeKeyForRange as getSharedPriceChangeKeyForRange } from "@ledgerhq/live-common/market/utils/rangePriceChangeKey";
import {
  resolveRangePriceChange as resolveSharedRangePriceChange,
  type RangePriceChange,
} from "@ledgerhq/live-common/market/utils/resolveRangePriceChange";
import type { LineChartRange } from "LLD/components/LineChart";

export type TrendVariant = "positive" | "negative" | "neutral";

const DESKTOP_PRICE_CHANGE_KEY_EXTENSIONS: Partial<Record<LineChartRange, KeysPriceChange>> = {
  "6m": KeysPriceChange.sixMonths,
  "5y": KeysPriceChange.year,
};

export type { RangePriceChange };

export function getPriceChangeKeyForRange(range: LineChartRange): KeysPriceChange | undefined {
  return getSharedPriceChangeKeyForRange(range, DESKTOP_PRICE_CHANGE_KEY_EXTENSIONS);
}

type ResolveRangePriceChangeParams = Readonly<{
  selectedRange: LineChartRange;
  chartPrices: readonly number[];
  price?: number;
  priceChangePercentage?: Record<KeysPriceChange, number>;
}>;

export function resolveRangePriceChange({
  selectedRange,
  chartPrices,
  price,
  priceChangePercentage,
}: ResolveRangePriceChangeParams): RangePriceChange {
  return resolveSharedRangePriceChange({
    selectedRange,
    chartPrices,
    price,
    priceChangePercentage,
    priceChangeKeyExtensions: DESKTOP_PRICE_CHANGE_KEY_EXTENSIONS,
  });
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
