import { z } from "zod";
import type {
  CardAuthorizationGrant,
  CardSessionHandle,
  CardSessionRefreshResult,
  CardSessionSnapshot,
} from "./types";

const isFunction = (value: unknown) => typeof value === "function";
const mustBeAFunction = (name: string) => ({ message: `${name} must be a function` });

/**
 * The two tokens a grant answers with, as the session owner stores them. The lifetime a
 * `PayCardSession` also carries is not part of this: nothing reads it, because a renewal starts
 * from a 401 rather than from a clock.
 */
export type CardSessionCredentials = Readonly<{
  accessToken: string;
  refreshToken: string;
}>;

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
   * It answers with the epoch as well as the token, so the base query can tell the owner which
   * session a 401 belongs to. See {@link CardSessionSnapshot}.
   */
  readCardSession: z.custom<() => Promise<CardSessionSnapshot>>(
    isFunction,
    mustBeAFunction("readCardSession"),
  ),
  /**
   * Read by the refresh grant off `api.extra`, so no token ever becomes a mutation argument. The
   * desktop redux logger records every argument, in production, into the file users attach to
   * support tickets.
   */
  getCardRefreshToken: z.custom<() => Promise<string | null | undefined>>(
    isFunction,
    mustBeAFunction("getCardRefreshToken"),
  ),
  /**
   * Read by the authorization-code grant off `api.extra`, for the same reason. The login flow puts
   * the grant here right before it dispatches, and this call takes it: a grant is used once.
   */
  takeCardAuthorizationGrant: z.custom<() => CardAuthorizationGrant | null>(
    isFunction,
    mustBeAFunction("takeCardAuthorizationGrant"),
  ),
  /**
   * Where a grant hands its answer, instead of returning it.
   *
   * RTK Query puts every answer into a redux action, and a token grant answers with two credentials.
   * The grant gives the session to the owner and returns the handle this call answers with, so the
   * action carries a handle and the caller reads the session back out of band.
   */
  receiveCardSession: z.custom<(session: CardSessionCredentials) => CardSessionHandle>(
    isFunction,
    mustBeAFunction("receiveCardSession"),
  ),
  /**
   * The one renewal entry, called by the base query after a 401. It takes the epoch the request was
   * sent with, so a request that outlived its session neither renews nor cleans up.
   */
  refreshCardSession: z.custom<(epoch: number) => Promise<CardSessionRefreshResult>>(
    isFunction,
    mustBeAFunction("refreshCardSession"),
  ),
});
