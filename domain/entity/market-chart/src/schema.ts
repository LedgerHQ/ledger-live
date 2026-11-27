import { z } from "zod";

export const MarketChartRangeSchema = z.enum([
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
]);

/** A `[timestamp, value]` point of a chart. */
export const ChartDataPointSchema = z.tuple([z.number(), z.number()]);

export const MarketChartApiResponseSchema = z.object({
  values: z.array(ChartDataPointSchema),
});

/** Chart points keyed by the range the caller asked for. */
export const MarketCoinDataChartSchema = z.record(z.string(), z.array(ChartDataPointSchema));

// The backend mixes fiat tickers (EUR) and coin ids (bitcoin).
export const SupportedChartCounterCurrenciesSchema = z.array(z.string().min(1));
