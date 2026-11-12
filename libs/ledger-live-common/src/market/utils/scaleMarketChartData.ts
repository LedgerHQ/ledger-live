import type { MarketCoinDataChart } from "./types";

/**
 * Multiply every chart value by `rate`, keeping timestamps and shape intact.
 *
 * Used when the chart allowlist does not include the user's counter value:
 * the chart is fetched in USD and each point is multiplied by the USD rate.
 * No-op when `rate === 1` or there is no data.
 */
export function scaleMarketChartData(
  chartData: MarketCoinDataChart | undefined,
  rate: number,
): MarketCoinDataChart | undefined {
  if (!chartData || rate === 1) return chartData;

  const scaled: MarketCoinDataChart = {};
  for (const [range, points] of Object.entries(chartData)) {
    scaled[range] = points.map(([timestamp, value]) => [timestamp, value * rate]);
  }
  return scaled;
}
