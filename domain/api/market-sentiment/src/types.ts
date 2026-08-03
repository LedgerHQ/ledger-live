import { z } from "zod";
import { FearAndGreedResponseSchema } from "./schema";

/** The raw CoinMarketCap `/fear-and-greed/latest` response. */
export type FearAndGreedResponse = z.infer<typeof FearAndGreedResponseSchema>;
