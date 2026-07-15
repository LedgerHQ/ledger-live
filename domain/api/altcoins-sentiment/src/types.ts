import { z } from "zod";
import { AltcoinSeasonIndexResponseSchema, AltcoinsSentimentApiExtraSchema } from "./schema";

/** The raw CoinMarketCap `/altcoin-season-index/latest` response. */
export type AltcoinSeasonIndexResponse = z.infer<typeof AltcoinSeasonIndexResponseSchema>;

/** Thunk `extraArgument` contract for the altcoins-sentiment api. */
export type AltcoinsSentimentApiExtra = z.infer<typeof AltcoinsSentimentApiExtraSchema>;
