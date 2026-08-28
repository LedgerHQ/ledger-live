export const CARD_REDUCER_PATH = "cardApi";

export const HEADER_X_CLIENT_KEY = "x-client-key";

/**
 * The body the base query answers with once the session owner has finished terminal cleanup. It
 * mirrors `PayCardErrorResponseSchema`, so anything that already parses a Card error body keeps
 * working, and it names a locally-ended session rather than a backend rejection.
 */
export const CARD_SESSION_ENDED = "card_session_ended";

/** Stands in for any value a Card action must not carry into a log or into DevTools. */
export const REDACTED = "[redacted]";
