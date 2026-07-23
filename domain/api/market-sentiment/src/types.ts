import { z } from "zod";
import { FearAndGreedResponseSchema, MarketSentimentApiExtraSchema } from "./schema";

/** The raw CoinMarketCap `/fear-and-greed/latest` response. */
export type FearAndGreedResponse = z.infer<typeof FearAndGreedResponseSchema>;

/** Thunk `extraArgument` contract for the market-sentiment api. */
export type MarketSentimentApiExtra = z.infer<typeof MarketSentimentApiExtraSchema>;
