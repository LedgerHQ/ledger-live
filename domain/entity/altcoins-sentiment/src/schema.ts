import { z } from "zod";

/**
 * Canonical altcoins-sentiment value: the CMC Altcoin Season Index, transformed from the raw
 * CoinMarketCap response into the shape the app consumes.
 */
export const AltcoinSeasonIndexSchema = z.object({
  value: z.number().min(0).max(100),
  altcoinMarketcap: z.number(),
});
