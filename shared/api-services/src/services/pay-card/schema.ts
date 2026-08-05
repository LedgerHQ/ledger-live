import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every Pay Card-API-backed api. The app supplies the resolved
 * base URL at store configuration time, so this package owns no env/config dependency.
 *
 * `getPayCardSessionToken` is read on every request: the app session token is minted by the
 * authentication flow after store creation, so the config holds a reader rather than a value.
 */
export const PayCardApiExtraSchema = z.object({
  payCardApiBaseUrl: z.string().trim().min(1),
  getPayCardSessionToken: z.custom<() => string | null | undefined>().optional(),
});
