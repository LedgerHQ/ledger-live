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
  ChartCounterCurrencies = "ChartCounterCurrencies",
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

// /v3/supported/markets/chart/to mixes fiat tickers (EUR) and coin ids (bitcoin).
export const SupportedChartCounterCurrenciesSchema = z
  .array(z.string().min(1))
  .transform(currencies => currencies.map(currency => currency.toLowerCase()));

export type MarketChartApiResponse = z.infer<typeof MarketChartApiResponseSchema>;

// Raw /v3/currencies/trending response: an ordered list of { id, supported } currencies.
export const TrendingCurrenciesResponseSchema = z.array(
  z.object({
    id: z.string(),
    supported: z.boolean(),
  }),
);

export type TrendingCurrency = z.infer<typeof TrendingCurrenciesResponseSchema>[number];
