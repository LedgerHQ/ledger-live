export const CARD_REDUCER_PATH = "cardApi";

export const HEADER_X_CLIENT_KEY = "x-client-key";

/**
 * The status Baanx answers when a Bearer is missing, expired or rejected. Declared here because the
 * base query and the login flow must agree on the one number that starts a renewal and ends a
 * session.
 */
export const UNAUTHORIZED_STATUS = 401;

/**
 * The base query's answer to a request whose session a logout or a newer login already replaced.
 *
 * Not a 401: that request says nothing about the session on disk, and a 401 here would end a session
 * that belongs to somebody else.
 */
export const CARD_STALE_REQUEST = "card_stale_request";
