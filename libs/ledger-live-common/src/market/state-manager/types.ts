import { z } from "zod";
import type {
  MarketListRequestParams,
  MarketPerformersParams,
  TrendingPerformersParams,
} from "../utils/types";

export enum MarketDataTags {
  Performers = "Performers",
  CurrencyData = "CurrencyData",
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

// Raw /v3/currencies/trending response: an ordered list of { id, supported } currencies.
export const TrendingCurrenciesResponseSchema = z.array(
  z.object({
    id: z.string(),
    supported: z.boolean(),
  }),
);

export type TrendingCurrency = z.infer<typeof TrendingCurrenciesResponseSchema>[number];
