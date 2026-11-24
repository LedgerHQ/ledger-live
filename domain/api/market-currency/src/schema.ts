import { z } from "zod";

/**
 * Raw `/v3/markets` item, as the endpoint serves it. `currencyId` and `priceChangePercentage6m` are
 * not in every response, and `maxSupply` is `null` for coins without a cap.
 */
export const MarketItemResponseSchema = z.object({
  allTimeHigh: z.number(),
  allTimeHighDate: z.string(),
  allTimeLow: z.number(),
  allTimeLowDate: z.string(),
  circulatingSupply: z.number(),
  currencyId: z.string().optional(),
  fullyDilutedValuation: z.number(),
  high24h: z.number(),
  id: z.string(),
  image: z.string(),
  ledgerIds: z.array(z.string()),
  low24h: z.number(),
  marketCap: z.number(),
  marketCapChange24h: z.number(),
  marketCapChangePercentage24h: z.number(),
  marketCapRank: z.number(),
  maxSupply: z.number().nullable(),
  name: z.string(),
  price: z.number(),
  priceChange24h: z.number(),
  priceChangePercentage1h: z.number(),
  priceChangePercentage24h: z.number(),
  priceChangePercentage30d: z.number(),
  priceChangePercentage7d: z.number(),
  priceChangePercentage6m: z.number().optional(),
  priceChangePercentage1y: z.number(),
  ticker: z.string(),
  totalSupply: z.number(),
  totalVolume: z.number(),
  updatedAt: z.string(),
});

/** A `/v3/markets` page: the list of raw items, in the order the endpoint returns them. */
export const MarketItemListResponseSchema = z.array(MarketItemResponseSchema);

/** A raw `/v3/markets` item inferred from {@link MarketItemResponseSchema}. */
export type MarketItemResponse = z.infer<typeof MarketItemResponseSchema>;
