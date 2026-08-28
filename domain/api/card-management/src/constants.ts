/**
 * RTK Query cache tags owned by the Card Management use case. Registered on the shared `cardApi` via
 * `enhanceEndpoints({ addTagTypes })`, so the shared service never has to know they exist.
 */
export const CARD_MANAGEMENT_TAGS = ["CardStatus", "CardOnboardingStatus"] as const;

/** The one path both OAuth2 grants post to. `grant_type` separates them. */
export const OAUTH2_TOKEN_PATH = "/v1/auth/oauth2/token";
