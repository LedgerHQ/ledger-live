import { isCardRenewalUnavailable, isCardUnauthorized } from "@shared/api-services";

/**
 * Every way a login attempt can end badly. The kind, not a message, is what the machine carries: the
 * view turns it into copy, and a test can name the failure it expects.
 */
export type PayCardLoginErrorKind =
  | "pkce_failed"
  | "browser_open_failed"
  | "missing_attempt"
  | "exchange_failed"
  | "persist_failed"
  | "fetch_user_failed";

/**
 * A step ran without the value the step before it produced. It cannot happen through the machine's
 * own transitions; it exists so a broken invariant fails loudly instead of sending an empty verifier.
 */
export class MissingLoginStateError extends Error {
  constructor(what: string) {
    super(`The login ${what} is no longer available`);
    this.name = "MissingLoginStateError";
  }
}

/**
 * True for a Card HTTP 401 that says the session is finished.
 *
 * The base query has already tried to renew the session by the time this runs, so most 401s here do
 * mean the session is over. A session the owner ended itself arrives the same way: the base query
 * reports it as a 401 whose body carries `card_session_ended`.
 *
 * The one 401 that does not count is the base query's own `card_renewal_unavailable`. It says the
 * renewal could not run — a 5xx, a timeout, a transport failure, or a request that outlived its
 * session. Read as the end of a session, one network failure would sign the user out.
 */
export function isUnauthorizedError(error: unknown): boolean {
  return isCardUnauthorized(error) && !isCardRenewalUnavailable(error);
}
