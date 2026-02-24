import { z } from "zod";

export enum GcDataTags {
  Coins = "Coins",
  CounterCurrencies = "CounterCurrencies",
  ChartData = "ChartData",
}

// --- Zod Schemas ---

export const MarketCoinSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  symbol: z.string().min(1),
});

export const SupportedCoinsSchema = z.array(MarketCoinSchema);

export const SupportedCounterCurrenciesSchema = z.array(z.string().min(1));

const ChartDataPointSchema = z.tuple([z.number(), z.number()]);

export const MarketChartApiResponseSchema = z.object({
  prices: z.array(ChartDataPointSchema),
  market_caps: z.array(ChartDataPointSchema),
  total_volumes: z.array(ChartDataPointSchema),
});
