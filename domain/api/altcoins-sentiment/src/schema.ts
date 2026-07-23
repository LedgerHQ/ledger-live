import { z } from "zod";

const AltcoinSeasonIndexDataSchema = z.object({
  altcoin_index: z.number().min(0).max(100),
  altcoin_marketcap: z.number(),
});

const AltcoinSeasonIndexStatusSchema = z.object({
  timestamp: z.string(),
  error_code: z.union([z.number(), z.string()]),
  error_message: z.string().nullable(),
  elapsed: z.number(),
  credit_count: z.number(),
  notice: z.string().nullable(),
});

/** Raw CoinMarketCap `/altcoin-season-index/latest` wire-format response. */
export const AltcoinSeasonIndexResponseSchema = z.object({
  data: AltcoinSeasonIndexDataSchema,
  status: AltcoinSeasonIndexStatusSchema,
});

/**
 * Thunk `extraArgument` contract for the altcoins-sentiment api. The app supplies the resolved
 * CoinMarketCap URL at store configuration time, so this package owns no env/config dependency.
 */
export const AltcoinsSentimentApiExtraSchema = z.object({
  coinMarketCapApiUrl: z.string().min(1),
});
