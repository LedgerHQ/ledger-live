/**
 * RTK Query reducer path for the Card backend service. This is the single Card service api: every
 * Card use case (management now, auth once it migrates off the `@domain/api-pay-card` holdout under
 * LIVE-33829) injects its endpoints into this same object.
 */
export const CARD_REDUCER_PATH = "cardApi";
