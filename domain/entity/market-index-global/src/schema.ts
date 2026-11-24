import { z } from "zod";

/**
 * Canonical global market index: the CoinMarketCap-style market-wide figures, transformed from the
 * raw countervalues response into the shape the app consumes.
 */
export const MarketIndexGlobalSchema = z.object({
  marketCap: z.number(),
  changePercentage24h: z.number(),
});
