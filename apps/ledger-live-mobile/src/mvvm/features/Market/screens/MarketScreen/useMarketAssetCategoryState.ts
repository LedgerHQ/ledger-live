import { getMarketCategoriesParam } from "@ledgerhq/live-common/market/utils/category";
import type { MarketListCategory } from "~/reducers/types";

export type MarketAssetCategoryState = {
  isFavoritesCategory: boolean;
  isStocksCategory: boolean;
  marketCategoriesParam: string | undefined;
  favoriteIds: string[] | undefined;
  hasFavoriteIds: boolean;
  shouldFetchAssets: boolean;
};

export function useMarketAssetCategoryState({
  category,
  normalizedSearch,
  starredMarketCoins,
}: {
  category: MarketListCategory;
  normalizedSearch: string;
  starredMarketCoins: string[];
}): MarketAssetCategoryState {
  const hasSearch = normalizedSearch.length > 0;
  const isFavoritesCategory = !hasSearch && category === "starred";
  const isStocksCategory = !hasSearch && category === "stocks";
  const marketCategoriesParam = hasSearch ? undefined : getMarketCategoriesParam(category);
  const favoriteIds = isFavoritesCategory ? starredMarketCoins : undefined;
  const hasFavoriteIds = Boolean(favoriteIds?.length);
  const shouldFetchAssets = !isFavoritesCategory || hasFavoriteIds;

  return {
    isFavoritesCategory,
    isStocksCategory,
    marketCategoriesParam,
    favoriteIds,
    hasFavoriteIds,
    shouldFetchAssets,
  };
}
