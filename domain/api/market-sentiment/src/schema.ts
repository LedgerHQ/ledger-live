import { z } from "zod";

const FearAndGreedDataSchema = z.object({
  value: z.number().min(0).max(100),
  value_classification: z.string(),
  update_time: z.string(),
});

const FearAndGreedStatusSchema = z.object({
  timestamp: z.string(),
  error_code: z.union([z.number(), z.string()]),
  error_message: z.string(),
  elapsed: z.number(),
  credit_count: z.number(),
  notice: z.string().optional(),
});

/** Raw CoinMarketCap `/fear-and-greed/latest` wire-format response. */
export const FearAndGreedResponseSchema = z.object({
  data: FearAndGreedDataSchema,
  status: FearAndGreedStatusSchema,
});

/**
 * Thunk `extraArgument` contract for the market-sentiment api. The app supplies the resolved
 * CoinMarketCap URL at store configuration time, so this package owns no env/config dependency.
 */
export const MarketSentimentApiExtraSchema = z.object({
  coinMarketCapApiUrl: z.string().min(1),
});
