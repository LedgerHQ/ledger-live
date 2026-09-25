import { z } from "zod";
import { isFunction, mustBeAFunction } from "../../internals";

/**
 * Thunk `extraArgument` contract for every swap-aggregator-backed api. This package owns no
 * env/config dependency: the app supplies `ledgerClientVersion` resolved once at store configuration
 * time, and `getSwapApiBaseUrl` as a getter re-read on every request.
 */
export const SwapApiExtraSchema = z.object({
  /**
   * Read on every request, and not once at store creation: a tester sets `SWAP_API_BASE` in the debug
   * settings, and the next request carries the new value without a restart of the app.
   */
  getSwapApiBaseUrl: z.custom<() => string>(isFunction, mustBeAFunction("getSwapApiBaseUrl")),
  ledgerClientVersion: z.string().min(1),
});
