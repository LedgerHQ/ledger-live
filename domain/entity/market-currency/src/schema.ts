import { z } from "zod";
import { KeysPriceChange, MARKET_LIST_PAGE_SIZES, Order } from "./types";

/** Price variation windows, keyed as the UI and the market list read them. */
export const KeysPriceChangeSchema = z.enum(KeysPriceChange);

/** Sort orders of the market list. */
export const OrderSchema = z.enum(Order);

/** Page sizes the `/v3/markets` endpoint accepts. */
export const MarketListPageSizeSchema = z.literal(MARKET_LIST_PAGE_SIZES);

/** Chart series keyed by range, as `[timestamp, value]` points. */
export const MarketCurrencyChartDataSchema = z.record(
  z.string(),
  z.array(z.tuple([z.number(), z.number()])),
);

/** Arguments of the market list, paginated by `pageSize`. `limit` caps the total across pages. */
export const MarketListQueryArgSchema = z.object({
  counterCurrency: z.string().optional(),
  pageSize: MarketListPageSizeSchema,
  limit: z.number().optional(),
  order: OrderSchema.optional(),
  range: z.string().optional(),
  search: z.string().optional(),
  filter: z.string().optional(),
  starred: z.array(z.string()).optional(),
  liveCompatible: z.boolean().optional(),
  categories: z.string().optional(),
});

/** A currency as the market list and the market detail read it. */
export const MarketCurrencySchema = z.object({
  id: z.string(),
  ledgerIds: z.array(z.string()),
  name: z.string(),
  image: z.string().optional(),
  marketcap: z.number().optional(),
  marketcapRank: z.number(),
  totalVolume: z.number(),
  high24h: z.number(),
  low24h: z.number(),
  ticker: z.string(),
  price: z.number(),
  priceChangePercentage: z.record(KeysPriceChangeSchema, z.number()),
  marketCapChangePercentage24h: z.number(),
  circulatingSupply: z.number(),
  totalSupply: z.number().optional(),
  maxSupply: z.number().optional(),
  ath: z.number(),
  athDate: z.date(),
  atl: z.number(),
  atlDate: z.date(),
  chartData: MarketCurrencyChartDataSchema,
});
