import { z } from "zod";

/**
 * Schema for the Countervalues Service `/v3/supported/fiat` response: an array of ISO 4217 tickers
 * (e.g. `["USD", "EUR"]`). Non-string entries are dropped rather than rejecting the whole list, so a
 * single malformed item never wipes out every supported fiat.
 */
export const SupportedFiatsResponseSchema = z
  .array(z.unknown())
  .transform(items => items.filter((ticker): ticker is string => typeof ticker === "string"));
