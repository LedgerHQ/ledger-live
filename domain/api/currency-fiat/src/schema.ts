import { z } from "zod";

/**
 * Schema for the Countervalues Service `/v3/supported/fiat` response: an array of ISO 4217 tickers
 * (e.g. `["USD", "EUR"]`). Non-string entries are dropped rather than rejecting the whole list, so a
 * single malformed item never wipes out every supported fiat.
 */
export const SupportedFiatsResponseSchema = z
  .array(z.unknown())
  .transform(items => items.filter((ticker): ticker is string => typeof ticker === "string"));

/**
 * Thunk `extraArgument` contract for the fiat currency api. The app supplies the resolved
 * Countervalues Service URL at store configuration time, so this package owns no env/config
 * dependency. The app picks the prod or staging URL — there is no staging switch in here.
 */
export const CvsApiExtraSchema = z.object({
  countervaluesServiceUrl: z.string().min(1),
});
