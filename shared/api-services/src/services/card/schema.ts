import { z } from "zod";
import type { CardSessionRefreshResult, CardSessionSnapshot } from "./types";

const isFunction = (value: unknown) => typeof value === "function";
const mustBeAFunction = (name: string) => ({
  message: `${name} must be a function`,
});

export const CardApiExtraSchema = z.object({
  /**
   * The two Card values are read on every request, and not once at store creation: a tester sets
   * `CARD_BAANX_API_URL` and `CARD_BAANX_CLIENT_KEY` in the debug settings, and the next request carries
   * the new value without a restart of the app.
   */
  getCardApiBaseUrl: z.custom<() => string>(isFunction, mustBeAFunction("getCardApiBaseUrl")),
  getCardBaanxClientKey: z.custom<() => string>(
    isFunction,
    mustBeAFunction("getCardBaanxClientKey"),
  ),
  /**
   * True while the holder belongs to the provider's US tenant. Read on every request for the same
   * reason as the two above: the answer compares a stored app id with an env the debug settings can
   * change, and the next request must carry the new answer.
   */
  isCardUsEnv: z.custom<() => boolean>(isFunction, mustBeAFunction("isCardUsEnv")),
  readCardSession: z.custom<() => Promise<CardSessionSnapshot>>(
    isFunction,
    mustBeAFunction("readCardSession"),
  ),
  isCardSessionCurrent: z.custom<(sessionId: number) => boolean>(
    isFunction,
    mustBeAFunction("isCardSessionCurrent"),
  ),
  refreshCardSession: z.custom<
    (sessionId: number, accessToken: string) => Promise<CardSessionRefreshResult>
  >(isFunction, mustBeAFunction("refreshCardSession")),
});
