import type { z } from "zod";
import type { CardApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the Card backend service. */
export type CardApiExtra = z.infer<typeof CardApiExtraSchema>;

/**
 * The access token, plus the identity of the session it came from.
 *
 * `epoch` changes every time the owner replaces or clears the stored session. The base query keeps
 * the epoch it sent a request with and hands it back when it asks for a renewal, so the owner can
 * tell "renew the session this request used" from "this request outlived its session".
 */
export type CardSessionSnapshot = Readonly<{
  token: string | null;
  epoch: number;
}>;

/** A renewal failure, reduced to what a caller may see. Never a response body. */
export type CardSessionRenewalError = Readonly<{
  status?: number | string;
  message: string;
}>;

/**
 * What the session owner tells the base query when it asks for a renewal.
 *
 * The owner decides; the base query only reports. A discriminated result keeps that split honest: a
 * bare token could not tell "the session is over" apart from "ask again later".
 */
export type CardSessionRefreshResult =
  /** A new access token is on disk, for the same session. Replay the original request with it, once. */
  | { readonly kind: "refreshed"; readonly accessToken: string }
  /** Terminal cleanup has already run. The base query answers 401 `card_session_ended`. */
  | { readonly kind: "session-ended" }
  /**
   * The request outlived its session: a logout or a new login replaced it while the request was in
   * flight. Nothing was renewed and nothing was cleaned up, because the session on disk now belongs
   * to somebody else. The original error stands.
   */
  | { readonly kind: "session-replaced" }
  /** Nonterminal. The session may still be good, and the original error stands. */
  | { readonly kind: "unavailable"; readonly error: CardSessionRenewalError };

/**
 * The one-shot receipt a token grant answers with.
 *
 * A grant answers with two credentials, and RTK Query puts every answer into a redux action. So the
 * grant hands the session to the owner through `receiveCardSession` and returns this handle instead.
 * The caller reads the session back with the handle, and no action ever carries a token.
 */
export type CardSessionHandle = string;

/** What the authorization-code grant presents. Read off `extra`, never passed as an argument. */
export type CardAuthorizationGrant = Readonly<{
  code: string;
  codeVerifier: string;
}>;

/**
 * What the Card base query reports as `meta`.
 *
 * `fetchBaseQuery` reports the whole `Request`, whose headers carry the Bearer, and RTK copies that
 * into `meta.baseQueryMeta` on every action. The Card base query answers with these three plain
 * values instead, so no Card action can carry a credential in its metadata.
 */
export type CardBaseQueryMeta = Readonly<{
  requestUrl?: string;
  requestMethod?: string;
  responseStatus?: number;
}>;

/**
 * Per-endpoint switches, read off `extraOptions`. The default is to participate, so an endpoint that
 * says nothing gets a Bearer and the 401 renewal.
 */
export type CardBaseQueryExtraOptions = {
  /**
   * `false` sends no Bearer and never renews on a 401. The two OAuth2 grants set it: they
   * authenticate themselves, and without it a dead refresh token loops
   * `401 -> refreshCardSession -> refreshSession -> 401 -> ...`.
   *
   * The key is the one `@shared/auth`'s `createAuthenticatedBaseQuery` already uses.
   */
  authenticated?: boolean;
};
