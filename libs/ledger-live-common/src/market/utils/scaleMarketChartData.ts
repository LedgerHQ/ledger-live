import type { MarketCoinDataChart } from "./types";

/**
 * Multiply every chart value by `rate`, keeping timestamps and shape intact.
 *
 * Used to rescale a USD-denominated chart into a crypto countervalue: the
 * markets chart endpoint only supports fiat `to`, so for a crypto countervalue
 * we fetch in USD and apply the USD→crypto spot rate here. No-op when
 * `rate === 1` or there is no data.
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
