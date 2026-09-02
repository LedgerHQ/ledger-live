import type { z } from "zod";
import type { CardApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the Card backend service. */
export type CardApiExtra = z.infer<typeof CardApiExtraSchema>;

/**
 * The access token, and the id of the session it came from.
 *
 * Every login and every logout starts a new session and gives it a new id. A renewal keeps the id,
 * because it is the same session with a fresh token.
 *
 * The base query keeps the id it sent a request with and hands it back when it asks for a renewal.
 * That is how the owner tells "renew the session this request used" from "this request outlived its
 * session".
 */
export type CardSessionSnapshot = Readonly<{
  token: string | null;
  sessionId: number;
}>;

/**
 * What the session owner tells the base query when it asks for a renewal. Three answers, and no
 * fourth. The owner decides; the base query only reports.
 */
export type CardSessionRefreshResult =
  /** A new access token is on disk, for the same session. Replay the original request with it, once. */
  | { readonly kind: "refreshed"; readonly accessToken: string }
  /**
   * The renewal failed, so the session is over and terminal cleanup has already run. The base query
   * answers with the 401 the provider sent.
   */
  | { readonly kind: "session-ended" }
  /**
   * A logout or a newer login replaced the session while the request was in flight. Nothing was
   * renewed and nothing was cleared: the request belongs to a session that no longer exists.
   */
  | { readonly kind: "session-replaced" };

/**
 * The per-endpoint options the Card base query reads.
 *
 * `authenticated: false` marks the two OAuth2 grants. They present their own credential, so they
 * take no Bearer, and they must never renew: a renewal that renewed would answer its own 401 with
 * another grant and loop.
 */
export type CardBaseQueryExtraOptions = Readonly<{
  authenticated?: boolean;
}>;
