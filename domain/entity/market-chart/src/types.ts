import type { z } from "zod";
import type { ChartDataPointSchema, MarketCoinDataChartSchema } from "./schema";

export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;

export type MarketCoinDataChart = z.infer<typeof MarketCoinDataChartSchema>;

/** Ranges the chart endpoints accept, named as the UI names them. */
export const MARKET_CHART_RANGES = [
  "1h",
  "1d",
  "24h",
  "day",
  "1w",
  "7d",
  "week",
  "1m",
  "30d",
  "month",
  "6m",
  "1y",
  "year",
  "5y",
  "all",
] as const;

export type MarketChartRange = (typeof MARKET_CHART_RANGES)[number];
