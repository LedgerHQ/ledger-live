import { buildMarketChartSeries } from "@ledgerhq/live-common/market/utils/buildMarketChartSeries";
import type { MarketCoinDataChart } from "@ledgerhq/live-common/market/utils/types";
import type { LineChartRange } from "LLD/components/LineChart";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Target spacing between chart points per range (LIVE-31777). 6m is served
// daily, so its 3h target falls back to the daily resolution.
export const ASSET_DETAIL_RANGE_TARGET_INTERVAL_MS: Record<LineChartRange, number> = {
  "1d": 5 * MINUTE_MS,
  "1w": HOUR_MS,
  "1m": 2 * HOUR_MS,
  "6m": 3 * HOUR_MS,
  "1y": DAY_MS,
  "5y": 7 * DAY_MS,
  all: 7 * DAY_MS,
};

type BuildAssetDetailChartSeriesParams = Readonly<{
  chartData?: MarketCoinDataChart;
  selectedRange: LineChartRange;
  ath?: number;
  atl?: number;
  athTime?: number;
  atlTime?: number;
}>;

export function buildAssetDetailChartSeries({
  chartData,
  selectedRange,
  ath,
  atl,
  athTime,
  atlTime,
}: BuildAssetDetailChartSeriesParams): { prices: number[]; timestamps: number[] } {
  return buildMarketChartSeries({
    chartData,
    range: selectedRange,
    targetIntervalMs: ASSET_DETAIL_RANGE_TARGET_INTERVAL_MS[selectedRange],
    ath,
    atl,
    athTime,
    atlTime,
  });
}
