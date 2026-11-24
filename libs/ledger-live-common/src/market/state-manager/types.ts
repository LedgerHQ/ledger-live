import { z } from "zod";
import type { MarketPerformersParams, TrendingPerformersParams } from "../utils/types";

export enum MarketDataTags {
  Performers = "Performers",
  CurrencyData = "CurrencyData",
  ChartData = "ChartData",
  ChartCounterCurrencies = "ChartCounterCurrencies",
  GlobalData = "GlobalData",
  TrendingCategories = "TrendingCategories",
  TrendingPerformers = "TrendingPerformers",
  MarketList = "MarketList",
}

export {
  MARKET_LIST_MIN_SEARCH_LENGTH,
  MARKET_LIST_PAGE_SIZES,
  type MarketListPageSize,
  type MarketListQueryArg,
} from "@domain/entity-market-currency";

export type MarketPerformersQueryParams = Omit<MarketPerformersParams, "refreshRate">;

export type TrendingPerformersQueryParams = Omit<TrendingPerformersParams, "refreshRate">;

export type { MarketsByLedgerIdsQueryParams } from "@domain/api-market-currency";

export const MarketChartApiResponseSchema = z.object({
  values: z.array(z.tuple([z.number(), z.number()])),
});

// /v3/supported/markets/chart/to mixes fiat tickers (EUR) and coin ids (bitcoin).
export const SupportedChartCounterCurrenciesSchema = z
  .array(z.string().min(1))
  .transform(currencies => currencies.map(currency => currency.toLowerCase()));

export type MarketChartApiResponse = z.infer<typeof MarketChartApiResponseSchema>;

// Raw /v3/markets/global response: percentageChanges values are ratios (e.g. -0.0171 = -1.71%).
export const GlobalMarketDataResponseSchema = z.object({
  marketCap: z.number(),
  percentageChanges: z.object({
    "1d": z.number(),
  }),
});

export type GlobalMarketDataResponse = z.infer<typeof GlobalMarketDataResponseSchema>;

export interface GlobalMarketDataRequestParams {
  counterCurrency: string;
}

export interface GlobalMarketData {
  marketCap: number;
  // 24h change expressed as a percentage (e.g. -1.71), ready for display.
  changePercentage24h: number;
}

// Raw /v3/categories/trending response: a list of { id, name } categories.
export const TrendingCategoriesResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
  }),
);

export type MarketTrendingCategory = z.infer<typeof TrendingCategoriesResponseSchema>[number];

// Raw /v3/currencies/trending response: an ordered list of { id, supported } currencies.
export const TrendingCurrenciesResponseSchema = z.array(
  z.object({
    id: z.string(),
    supported: z.boolean(),
  }),
);

export type TrendingCurrency = z.infer<typeof TrendingCurrenciesResponseSchema>[number];
