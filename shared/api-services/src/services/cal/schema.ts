import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every CAL-backed api. The app supplies the resolved CAL service
 * URL, client version and an optional logger at store configuration time, so this package owns no
 * env/config/logging dependency. The app picks the prod or staging URL — there is no staging switch
 * in here.
 */
export const CalApiExtraSchema = z.object({
  calServiceUrl: z.string().min(1),
  ledgerClientVersion: z.string().min(1),
  logger: z.custom<(...args: unknown[]) => void>().optional(),
});
