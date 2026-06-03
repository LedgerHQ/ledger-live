import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";

// Range buckets surfaced in the BalanceGraph segmented control.
export const BALANCE_GRAPH_RANGES = ["1d", "1w", "1m", "6m", "1y", "all"] as const;

export type RangeKey = (typeof BALANCE_GRAPH_RANGES)[number];

const RANGE_KEY_SET: ReadonlySet<string> = new Set(BALANCE_GRAPH_RANGES);

export const RANGE_TO_PRICE_CHANGE_KEY: Partial<Record<RangeKey, KeysPriceChange>> = {
  "1d": KeysPriceChange.day,
  "1w": KeysPriceChange.week,
  "1m": KeysPriceChange.month,
  "1y": KeysPriceChange.year,
};

const CHART_DERIVED_PRICE_CHANGE_RANGES = new Set<RangeKey>(["6m", "all"]);

export function isChartDerivedPriceChangeRange(range: RangeKey): boolean {
  return CHART_DERIVED_PRICE_CHANGE_RANGES.has(range);
}

export function computeChartRangeChangePercentage(prices: readonly number[]): number | undefined {
  if (prices.length < 2) return undefined;
  const first = prices[0];
  const last = prices[prices.length - 1];
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}

export function isRangeKey(value: string): value is RangeKey {
  return RANGE_KEY_SET.has(value);
}
