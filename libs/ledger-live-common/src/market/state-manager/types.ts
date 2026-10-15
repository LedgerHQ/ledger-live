import { z } from "zod";
import type {
  MarketListRequestParams,
  MarketPerformersParams,
  TrendingPerformersParams,
} from "../utils/types";

export enum MarketDataTags {
  Performers = "Performers",
  CurrencyData = "CurrencyData",
  ChartData = "ChartData",
  GlobalData = "GlobalData",
  TrendingCategories = "TrendingCategories",
  TrendingPerformers = "TrendingPerformers",
  MarketList = "MarketList",
}

export const MARKET_LIST_PAGE_SIZES = [1, 5, 20, 50] as const;

export const MARKET_LIST_MIN_SEARCH_LENGTH = 2;

export type MarketListPageSize = (typeof MARKET_LIST_PAGE_SIZES)[number];

export type MarketListQueryArg = Omit<MarketListRequestParams, "limit"> & {
  pageSize: MarketListPageSize;
  /** Max number of results across pages. A page size stays on `pageSize`. */
  limit?: number;
};

export type MarketPerformersQueryParams = Omit<MarketPerformersParams, "refreshRate">;

export type TrendingPerformersQueryParams = Omit<TrendingPerformersParams, "refreshRate">;

export interface MarketsByLedgerIdsQueryParams {
  ledgerIds: string[];
  counterCurrency: string;
}

export const MarketChartApiResponseSchema = z.object({
  values: z.array(z.tuple([z.number(), z.number()])),
});

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
