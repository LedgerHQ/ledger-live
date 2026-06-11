import { useMemo } from "react";
import type { MarketListCategory } from "~/reducers/types";

export type MarketAssetCategoryState = {
  isFavoritesCategory: boolean;
  isStocksCategory: boolean;
  sortedFavoriteIds: string[] | undefined;
  favoriteIdsKey: string;
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
  const sortedFavoriteIds = useMemo(
    () => getSortedFavoriteIds(isFavoritesCategory, starredMarketCoins),
    [isFavoritesCategory, starredMarketCoins],
  );
  const favoriteIdsKey = sortedFavoriteIds?.join(",") ?? "";
  const hasFavoriteIds = Boolean(sortedFavoriteIds?.length);
  const shouldFetchAssets = !isFavoritesCategory || hasFavoriteIds;

  return {
    isFavoritesCategory,
    isStocksCategory,
    sortedFavoriteIds,
    favoriteIdsKey,
    hasFavoriteIds,
    shouldFetchAssets,
  };
}

function getSortedFavoriteIds(
  isFavoritesCategory: boolean,
  starredMarketCoins: string[],
): string[] | undefined {
  if (!isFavoritesCategory) {
    return undefined;
  }

  return [...starredMarketCoins].sort((firstId, secondId) => firstId.localeCompare(secondId));
}
