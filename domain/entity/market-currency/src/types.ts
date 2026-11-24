import type { z } from "zod";
import type {
  MarketCurrencyChartDataSchema,
  MarketCurrencySchema,
  MarketListQueryArgSchema,
} from "./schema";

/** Price variation windows, keyed as the UI and the market list read them. */
export enum KeysPriceChange {
  hour = "1h",
  day = "24h",
  week = "7d",
  month = "30d",
  sixMonths = "6m",
  year = "1y",
}

/** Sort orders of the market list. */
export enum Order {
  MarketCapDesc = "desc",
  MarketCapAsc = "asc",
  topLosers = "topLosers",
  topGainers = "topGainers",
  VolumeDesc = "volume-desc",
  VolumeAsc = "volume-asc",
}

/** Page sizes the `/v3/markets` endpoint accepts. */
export const MARKET_LIST_PAGE_SIZES = [1, 5, 20, 50] as const;

export type MarketListPageSize = (typeof MARKET_LIST_PAGE_SIZES)[number];

/** A search shorter than this is not sent to the market list. */
export const MARKET_LIST_MIN_SEARCH_LENGTH = 2;

/** Arguments of the market list, inferred from {@link MarketListQueryArgSchema}. */
export type MarketListQueryArg = z.infer<typeof MarketListQueryArgSchema>;

/** Chart series keyed by range, inferred from {@link MarketCurrencyChartDataSchema}. */
export type MarketCurrencyChartData = z.infer<typeof MarketCurrencyChartDataSchema>;

/** A currency as the market list and the market detail read it, inferred from {@link MarketCurrencySchema}. */
export type MarketCurrency = z.infer<typeof MarketCurrencySchema>;
