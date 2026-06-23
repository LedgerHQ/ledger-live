// Range buckets surfaced in the BalanceGraph segmented control.
export const BALANCE_GRAPH_RANGES = ["1d", "1w", "1m", "1y", "all"] as const;

export type RangeKey = (typeof BALANCE_GRAPH_RANGES)[number];

const RANGE_KEY_SET: ReadonlySet<string> = new Set(BALANCE_GRAPH_RANGES);

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Target spacing between chart points per range (LIVE-31777), coarser than
// desktop for render performance. 1w is 2h since hourly data can't yield 1.5h.
export const RANGE_TARGET_INTERVAL_MS: Record<RangeKey, number> = {
  "1d": 10 * MINUTE_MS,
  "1w": 2 * HOUR_MS,
  "1m": 6 * HOUR_MS,
  "1y": 3 * DAY_MS,
  all: 30 * DAY_MS,
};

export {
  computeChartRangeChangePercentage,
  isChartDerivedPriceChangeRange,
} from "@ledgerhq/live-common/market/utils/chartRangeVariation";

export function isRangeKey(value: string): value is RangeKey {
  return RANGE_KEY_SET.has(value);
}
