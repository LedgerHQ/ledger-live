import { z } from "zod";

/**
 * Schema for the Countervalues Service `/v3/supported/fiat` response: a list of
 * Coingecko fiat tickers (e.g. `["USD", "EUR", ...]`).
 */
export const SupportedFiatsResponseSchema = z.array(z.string());

/** Raw list of supported fiat tickers, inferred from {@link SupportedFiatsResponseSchema}. */
export type SupportedFiatTickers = z.infer<typeof SupportedFiatsResponseSchema>;
