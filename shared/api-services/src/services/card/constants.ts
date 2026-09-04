export const CARD_REDUCER_PATH = "cardApi";

export const HEADER_X_CLIENT_KEY = "x-client-key";

export const UNAUTHORIZED_STATUS = 401;

export const CARD_STALE_REQUEST = "card_stale_request";

export const CARD_GRANT_ENDPOINTS: ReadonlySet<string> = new Set([
  "exchangeAuthorizationCode",
  "refreshSession",
]);

export const REDACTED = "[REDACTED]";
