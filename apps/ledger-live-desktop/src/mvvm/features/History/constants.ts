export const HISTORY_DUST_FILTER_THRESHOLD_USD = 0.01;

export const HISTORY_TAB_SEARCH_PARAM = "tab";
/** Provider `currency.network` pair, or ticker, e.g. `?tab=card&asset=usdc.ethereum`. */
export const HISTORY_ASSET_SEARCH_PARAM = "asset";
export const HISTORY_TAB_CARD = "card";
export const HISTORY_TAB_CRYPTO = "crypto";

export type HistoryTab = typeof HISTORY_TAB_CRYPTO | typeof HISTORY_TAB_CARD;
