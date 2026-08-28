import { z } from "zod";
import type { CardSessionRefreshResult } from "./types";

const isFunction = (value: unknown) => typeof value === "function";
const mustBeAFunction = (name: string) => ({ message: `${name} must be a function` });

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
  /** Async: the owner reads the session from OS secure storage on every call. It never renews. */
  getCardSessionToken: z.custom<() => Promise<string | null | undefined>>(
    isFunction,
    mustBeAFunction("getCardSessionToken"),
  ),
  /**
   * Read by the refresh endpoint off `api.extra`, so no token ever becomes a mutation argument. The
   * desktop redux logger records every argument, in production, into the file users attach to
   * support tickets.
   */
  getCardRefreshToken: z.custom<() => Promise<string | null | undefined>>(
    isFunction,
    mustBeAFunction("getCardRefreshToken"),
  ),
  refreshCardSession: z.custom<() => Promise<CardSessionRefreshResult>>(
    isFunction,
    mustBeAFunction("refreshCardSession"),
  ),
});
