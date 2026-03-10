/** Page name used for analytics/tracking when the user is on the Portfolio view. */
export const PORTFOLIO_TRACKING_PAGE_NAME = "Portfolio";

/** Default time range for portfolio/countervalue sync (cold start, balance availability). */
export const DEFAULT_PORTFOLIO_RANGE = "day" as const;

/** Delay (ms) before treating countervalue polling as finished after pending goes false (avoids flicker). */
export const POLLING_FINISHED_DELAY_MS = 200;
