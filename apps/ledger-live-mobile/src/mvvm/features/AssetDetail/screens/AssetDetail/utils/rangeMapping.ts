import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";

// Range buckets surfaced in the BalanceGraph segmented control.
export const BALANCE_GRAPH_RANGES = ["1d", "1w", "1m", "1y"] as const;

export type RangeKey = (typeof BALANCE_GRAPH_RANGES)[number];

const RANGE_KEY_SET: ReadonlySet<string> = new Set(BALANCE_GRAPH_RANGES);

export const RANGE_TO_PRICE_CHANGE_KEY: Record<RangeKey, KeysPriceChange> = {
  "1d": KeysPriceChange.day,
  "1w": KeysPriceChange.week,
  "1m": KeysPriceChange.month,
  "1y": KeysPriceChange.year,
};

export function isRangeKey(value: string): value is RangeKey {
  return RANGE_KEY_SET.has(value);
}
