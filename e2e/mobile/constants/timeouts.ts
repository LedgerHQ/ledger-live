// Shared E2E wait budgets. Kept out of the page objects so utils can import them
// without depending on a page implementation.

// Quote API round trip. Resolves in under 10s; fail fast instead of inheriting the 60s default.
export const QUOTES_FETCH_TIMEOUT = 15_000;

// Time for the quote list to stop changing. Providers answer at their own pace, so this is
// deliberately looser than the fetch budget - fail-fast on the request must not cap settling.
export const PROVIDER_LIST_SETTLE_TIMEOUT = 30_000;

// A React commit that has already been triggered. Not a network wait.
export const UI_RENDER_TIMEOUT = 5_000;

// Quote countdown. Must exceed one 20s refresh cycle so a single slow refresh is not fatal.
export const COUNTDOWN_STABLE_TIMEOUT = 45_000;
