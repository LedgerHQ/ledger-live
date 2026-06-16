export const MAX_ITEM_DISPLAYED = 6;
export const EMPTY_STATE_STABLECOINS = 2;
export const EMPTY_STATE_CRYPTOS = 4;
export const MAX_STOCKS_TO_DISPLAY = 5;

/** How often to refetch DADA assets data so discovery/default row prices stay fresh. */
export const ASSETS_PRICE_REFRESH_INTERVAL_MS = 180_000;

/** Query param on `/assets` for which category to show (cryptos-only vs stablecoins-only). */
export const ASSETS_PAGE_CATEGORY_QUERY = "category";
export const ASSETS_PAGE_CATEGORY_CRYPTOS = "cryptos";
export const ASSETS_PAGE_CATEGORY_STABLECOINS = "stablecoins";
export const ASSETS_PAGE_CATEGORY_STOCKS = "stocks";

export type AssetsPageCategory =
  | typeof ASSETS_PAGE_CATEGORY_CRYPTOS
  | typeof ASSETS_PAGE_CATEGORY_STABLECOINS
  | typeof ASSETS_PAGE_CATEGORY_STOCKS;
