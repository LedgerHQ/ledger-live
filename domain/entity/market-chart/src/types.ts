import type { z } from "zod";
import type {
  ChartDataPointSchema,
  MarketChartApiResponseSchema,
  MarketChartRangeSchema,
  MarketCoinDataChartSchema,
  SupportedChartCounterCurrenciesSchema,
} from "./schema";

export type MarketChartRange = z.infer<typeof MarketChartRangeSchema>;
export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;
export type MarketChartApiResponse = z.infer<typeof MarketChartApiResponseSchema>;
export type MarketCoinDataChart = z.infer<typeof MarketCoinDataChartSchema>;
export type SupportedChartCounterCurrencies = z.infer<typeof SupportedChartCounterCurrenciesSchema>;
