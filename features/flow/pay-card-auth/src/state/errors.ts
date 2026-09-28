const UNAUTHORIZED_STATUS = 401;

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

const PARSING_ERROR_STATUS = "PARSING_ERROR";
const CUSTOM_ERROR_STATUS = "CUSTOM_ERROR";
const RENEW_FAILED_ERROR = "Card session renew failed";
const STALE_REQUEST_ERROR = "card_stale_request";

type CardQueryError = Readonly<{
  status?: unknown;
  originalStatus?: unknown;
  error?: unknown;
}>;

function asCardQueryError(error: unknown): CardQueryError | null {
  return typeof error === "object" && error !== null ? (error as CardQueryError) : null;
}

/**
 * True for a Card HTTP 401. The base query has already asked `refreshCardSession` to renew the
 * session by the time this runs, so a 401 here means the session is finished, not merely stale.
 */
export function isUnauthorizedError(error: unknown): boolean {
  const queryError = asCardQueryError(error);

  if (queryError === null) {
    return false;
  }

  return (
    queryError.status === UNAUTHORIZED_STATUS ||
    (queryError.status === PARSING_ERROR_STATUS &&
      queryError.originalStatus === UNAUTHORIZED_STATUS) ||
    (queryError.status === CUSTOM_ERROR_STATUS && queryError.error === RENEW_FAILED_ERROR)
  );
}

export function isStaleRequestError(error: unknown): boolean {
  const queryError = asCardQueryError(error);

  return (
    queryError !== null &&
    queryError.status === CUSTOM_ERROR_STATUS &&
    queryError.error === STALE_REQUEST_ERROR
  );
}
