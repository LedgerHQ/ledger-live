import { z } from "zod";

/**
 * Canonical market-sentiment value: the CMC Crypto Fear & Greed index, transformed from the raw
 * CoinMarketCap response into the shape the app consumes.
 */
export const FearAndGreedIndexSchema = z.object({
  value: z.number().min(0).max(100),
  classification: z.string(),
});
