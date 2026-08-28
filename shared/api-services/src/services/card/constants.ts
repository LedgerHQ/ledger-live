export const CARD_REDUCER_PATH = "cardApi";

export const HEADER_X_CLIENT_KEY = "x-client-key";

/**
 * The status Baanx answers when a Bearer is missing, expired or rejected. Declared here because the
 * base query, the token grants and the login flow must all agree on the one number that starts a
 * renewal and ends a session.
 */
export const UNAUTHORIZED_STATUS = 401;

/**
 * The body the base query answers with once the session owner has finished terminal cleanup. It
 * mirrors `PayCardErrorResponseSchema`, so anything that already parses a Card error body keeps
 * working, and it names a locally-ended session rather than a backend rejection.
 */
export const CARD_SESSION_ENDED = "card_session_ended";

/**
 * The body the base query answers with when a 401 could not be resolved into an answer about the
 * session: the renewal did not run, or it failed for a reason that says nothing about the token.
 *
 * The status stays 401, because that is what the provider said. The body is what stops the login
 * flow from reading a transport failure as the end of a session, and signing the user out.
 */
export const CARD_RENEWAL_UNAVAILABLE = "card_renewal_unavailable";

/** Stands in for any value a Card action must not carry into a log or into DevTools. */
export const REDACTED = "[redacted]";
