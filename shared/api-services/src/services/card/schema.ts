import { z } from "zod";
import type { CardSessionRefreshResult, CardSessionSnapshot } from "./types";

const isFunction = (value: unknown) => typeof value === "function";
const mustBeAFunction = (name: string) => ({
  message: `${name} must be a function`,
});

export const CardApiExtraSchema = z.object({
  /**
   * The two Card values are read on every request, and not once at store creation: a tester sets
   * `CARD_API_URL` and `CARD_BAANX_CLIENT_KEY` in the debug settings, and the next request carries
   * the new value without a restart of the app.
   */
  getCardApiBaseUrl: z.custom<() => string>(isFunction, mustBeAFunction("getCardApiBaseUrl")),
  getCardBaanxClientKey: z.custom<() => string>(
    isFunction,
    mustBeAFunction("getCardBaanxClientKey"),
  ),
  /**
   * Async: the owner reads the session from OS secure storage on every call. It never renews.
   *
   * It answers with the session id as well as the token, so the base query can tell the owner which
   * session a 401 belongs to. See {@link CardSessionSnapshot}.
   */
  readCardSession: z.custom<() => Promise<CardSessionSnapshot>>(
    isFunction,
    mustBeAFunction("readCardSession"),
  ),
  isCardSessionCurrent: z.custom<(sessionId: number) => boolean>(
    isFunction,
    mustBeAFunction("isCardSessionCurrent"),
  ),
  /**
   * The one renewal entry, called by the base query after a 401. It takes the session id the request
   * and access token the request was sent with. A request that outlived its session neither renews
   * nor cleans up, and a delayed 401 can reuse a token another request already refreshed.
   */
  refreshCardSession: z.custom<
    (sessionId: number, accessToken: string) => Promise<CardSessionRefreshResult>
  >(isFunction, mustBeAFunction("refreshCardSession")),
});
