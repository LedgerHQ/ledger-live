import { z } from "zod";

/** Global crypto market snapshot: total market cap and its 24h change, as a display-ready percentage. */
export const MarketIndexGlobalSchema = z.object({
  marketCap: z.number(),
  changePercentage24h: z.number(),
});
