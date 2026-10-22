import { appendLatestPriceToChart } from "./appendLatestPriceToChart";
import { injectMarketExtrema } from "./injectMarketExtrema";
import { resampleChartPointsByInterval } from "./resampleChartPoints";
import type { MarketCoinDataChart } from "./types";

type BuildMarketChartSeriesParams = Readonly<{
  chartData?: MarketCoinDataChart;
  range: string;
  targetIntervalMs: number;
  ath?: number;
  atl?: number;
  athTime?: number;
  atlTime?: number;
  latestPrice?: { price: number; timestamp: number };
}>;

export function buildMarketChartSeries({
  chartData,
  range,
  targetIntervalMs,
  ath,
  atl,
  athTime,
  atlTime,
  latestPrice,
}: BuildMarketChartSeriesParams): { prices: number[]; timestamps: number[] } {
  const rawPoints = chartData?.[range] ?? [];
  const withExtrema =
    range === "all"
      ? injectMarketExtrema(rawPoints, { ath, athDate: athTime, atl, atlDate: atlTime })
      : rawPoints;
  const resampled = resampleChartPointsByInterval(withExtrema, targetIntervalMs);
  const points = latestPrice
    ? appendLatestPriceToChart(resampled, latestPrice.price, latestPrice.timestamp)
    : resampled;
  const prices = points.map(([, value]) => value);
  const timestamps = points.map(([timestamp]) => timestamp);
  return { prices, timestamps };
}
