import { z } from "zod";

const isFunction = (value: unknown) => typeof value === "function";

export const CardApiExtraSchema = z.object({
  /**
   * The two Card values are read on every request, and not once at store creation: a tester sets
   * `CARD_API_URL` and `CARD_BAANX_CLIENT_KEY` in the debug settings, and the next request carries
   * the new value without a restart of the app.
   */
  getCardApiBaseUrl: z.custom<() => string>(isFunction, {
    message: "getCardApiBaseUrl must be a function",
  }),
  getCardBaanxClientKey: z.custom<() => string>(isFunction, {
    message: "getCardBaanxClientKey must be a function",
  }),
  /** Async: the owner reads the session from OS secure storage on every call. */
  getCardSessionToken: z.custom<() => Promise<string | null | undefined>>(isFunction, {
    message: "getCardSessionToken must be a function",
  }),
  refreshCardSession: z.custom<() => Promise<string | null | undefined>>(isFunction, {
    message: "refreshCardSession must be a function",
  }),
});
