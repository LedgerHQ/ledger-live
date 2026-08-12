import { z } from "zod";

/**
 * Thunk `extraArgument` contract for the Card backend api. The app resolves the base URL and supplies
 * the session-token accessors owned by the Card Auth session, so this package holds no env, auth-state
 * or store dependency.
 *
 * `getCardSessionToken` returns the current session token (or a nullish value when logged out);
 * `refreshCardSession` is invoked once after a `401`, returning the refreshed token or a nullish value
 * when the session cannot be renewed.
 */
export const CardApiExtraSchema = z.object({
  cardApiBaseUrl: z.string().min(1),
  getCardSessionToken: z.custom<() => string | null | undefined>(
    value => typeof value === "function",
    { message: "getCardSessionToken must be a function" },
  ),
  refreshCardSession: z.custom<() => Promise<string | null | undefined>>(
    value => typeof value === "function",
    { message: "refreshCardSession must be a function" },
  ),
});
