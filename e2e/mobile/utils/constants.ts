export const NANO_APP_CATALOG_PATH = "artifacts/appVersion/nano-app-catalog.json";

// Quote API round trip. Resolves in under 10s.
export const QUOTES_FETCH_TIMEOUT = 15_000;

// Time for the quote list to stop changing. Providers answer at their own pace, so this is
// deliberately looser than the fetch budget.
export const PROVIDER_LIST_SETTLE_TIMEOUT = 30_000;

// Quote countdown. Must exceed one 20s refresh cycle so a single slow refresh is not fatal.
export const COUNTDOWN_STABLE_TIMEOUT = 45_000;
