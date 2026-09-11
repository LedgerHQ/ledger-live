import { z } from "zod";

/**
 * Thunk `extraArgument` contract for the exchange transaction manager. The app supplies the resolved
 * values at store configuration time, so this package owns no env/config dependency.
 */
export const ExchangeFundApiExtraSchema = z.object({
  exchangeFundApiBaseUrl: z.string().min(1),
  ledgerClientVersion: z.string().min(1),
});
