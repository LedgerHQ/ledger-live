import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every swap-aggregator-backed api. The app supplies the resolved
 * values at store configuration time, so this package owns no env/config dependency.
 */
export const SwapApiExtraSchema = z.object({
  swapApiBaseUrl: z.string().min(1),
  ledgerClientVersion: z.string().min(1),
});
