import { z } from "zod";
import { AltcoinSeasonIndexResponseSchema } from "./schema";

/** The raw CoinMarketCap `/altcoin-season-index/latest` response. */
export type AltcoinSeasonIndexResponse = z.infer<typeof AltcoinSeasonIndexResponseSchema>;
