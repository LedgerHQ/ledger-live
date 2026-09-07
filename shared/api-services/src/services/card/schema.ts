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
