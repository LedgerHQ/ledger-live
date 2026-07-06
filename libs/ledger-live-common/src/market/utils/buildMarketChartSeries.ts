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
}>;

export function buildMarketChartSeries({
  chartData,
  range,
  targetIntervalMs,
  ath,
  atl,
  athTime,
  atlTime,
}: BuildMarketChartSeriesParams): { prices: number[]; timestamps: number[] } {
  const rawPoints = chartData?.[range] ?? [];
  const withExtrema =
    range === "all"
      ? injectMarketExtrema(rawPoints, { ath, athDate: athTime, atl, atlDate: atlTime })
      : rawPoints;
  const points = resampleChartPointsByInterval(withExtrema, targetIntervalMs);
  const prices = points.map(([, value]) => value);
  const timestamps = points.map(([timestamp]) => timestamp);
  return { prices, timestamps };
}
