export const MAX_ITEM_DISPLAYED = 6;
export const EMPTY_STATE_STABLECOINS = 2;
export const EMPTY_STATE_CRYPTOS = 4;

/** Query param on `/assets` for which category to show (cryptos-only vs stablecoins-only). */
export const ASSETS_PAGE_CATEGORY_QUERY = "category";
export const ASSETS_PAGE_CATEGORY_CRYPTOS = "cryptos";
export const ASSETS_PAGE_CATEGORY_STABLECOINS = "stablecoins";

export type AssetsPageCategory =
  | typeof ASSETS_PAGE_CATEGORY_CRYPTOS
  | typeof ASSETS_PAGE_CATEGORY_STABLECOINS;
