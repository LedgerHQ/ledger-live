import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every Pay Card-API-backed api. The app supplies the resolved
 * base URL at store configuration time, so this package owns no env/config dependency.
 */
export const PayCardApiExtraSchema = z.object({
  payCardApiBaseUrl: z.string().trim().min(1),
  payCardBaanxClientKey: z.string().trim(),
});
