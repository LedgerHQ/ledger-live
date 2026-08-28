import { isCardUnauthorized } from "@shared/api-services";

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
  override name = "MissingLoginStateError";
  constructor(what: string) {
    super(`The login ${what} is no longer available`);
  }
}

/**
 * True for a Card HTTP 401, which says the session is finished.
 *
 * The base query has already renewed the session, or ended it, by the time this runs. It answers a
 * 401 only when the provider refused a request the session could not rescue. Every other failure —
 * a store it could not read, a request whose session a newer login replaced — carries a different
 * status, so one network failure cannot sign the user out.
 */
export function isUnauthorizedError(error: unknown): boolean {
  return isCardUnauthorized(error);
}
