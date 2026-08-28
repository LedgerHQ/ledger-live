import type { z } from "zod";
import type { CardApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the Card backend service. */
export type CardApiExtra = z.infer<typeof CardApiExtraSchema>;

/**
 * What the session owner tells the base query when it asks for a renewal.
 *
 * The owner decides; the base query only reports. A discriminated result keeps that split honest: a
 * bare token could not tell "the session is over" apart from "ask again later".
 */
export type CardSessionRefreshResult =
  /** A new access token is on disk. Replay the original request with it, once. */
  | { readonly kind: "refreshed"; readonly accessToken: string }
  /** Terminal cleanup has already run. The base query answers 401. */
  | { readonly kind: "session-ended" }
  /** Nonterminal. The session survives, and the original error stands. */
  | { readonly kind: "unavailable"; readonly error: unknown };

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
