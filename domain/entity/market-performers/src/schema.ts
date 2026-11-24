import { z } from "zod";

/** A market performer: a currency with its price changes over the chosen windows. */
export const MarketItemPerformerSchema = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  priceChangePercentage1h: z.number(),
  priceChangePercentage24h: z.number(),
  priceChangePercentage7d: z.number(),
  priceChangePercentage30d: z.number(),
  priceChangePercentage1y: z.number(),
  image: z.string(),
  price: z.number(),
  ledgerIds: z.array(z.string()),
});
