import { resampleChartPointsByInterval } from "@ledgerhq/live-common/market/utils/resampleChartPoints";
import type { ChartDataPoint } from "@ledgerhq/live-common/market/utils/types";
import type { BalanceHistory } from "@ledgerhq/types-live";
import type { LineChartRange } from "LLD/components/LineChart";
import { ASSET_DETAIL_RANGE_TARGET_INTERVAL_MS } from "LLD/features/AssetDetail/utils/buildAssetDetailChartSeries";

const DAY_MS = 24 * 60 * 60 * 1000;

function getChartRangeStartTime(range: LineChartRange, now = Date.now()): number | undefined {
  switch (range) {
    case "6m":
      return now - 182 * DAY_MS;
    case "5y":
      return now - 5 * 365 * DAY_MS;
    default:
      return undefined;
  }
}

export function buildAnalyticsPortfolioChartSeries(
  history: BalanceHistory,
  selectedRange: LineChartRange,
  now = Date.now(),
): { prices: number[]; timestamps: number[] } {
  const startTime = getChartRangeStartTime(selectedRange, now);
  const filtered = startTime ? history.filter(point => point.date.getTime() >= startTime) : history;
  const source = filtered.length > 0 ? filtered : history;
  const points: ChartDataPoint[] = source.map(point => [point.date.getTime(), point.value]);
  const resampled = resampleChartPointsByInterval(
    points,
    ASSET_DETAIL_RANGE_TARGET_INTERVAL_MS[selectedRange],
  );

  return {
    prices: resampled.map(([, value]) => value),
    timestamps: resampled.map(([timestamp]) => timestamp),
  };
}
