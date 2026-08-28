/**
 * RTK Query cache tags owned by the Card Management use case. Registered on the shared `cardApi` via
 * `enhanceEndpoints({ addTagTypes })`, so the shared service never has to know they exist.
 */
export const CARD_MANAGEMENT_TAGS = ["CardStatus", "CardOnboardingStatus"] as const;

export const OAUTH2_TOKEN_PATH = "/v1/auth/oauth2/token";

/**
 * The refresh grant answered with no stored refresh token. Reported as a 401, because there is
 * nothing left to renew: the session owner must clean up rather than retry.
 */
export const MISSING_REFRESH_TOKEN = "missing_refresh_token";
