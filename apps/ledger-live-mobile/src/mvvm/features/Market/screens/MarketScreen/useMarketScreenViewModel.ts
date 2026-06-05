import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { useSelector } from "~/context/hooks";
import { starredMarketCoinsSelector } from "~/reducers/settings";
import { useMarketAssetPress } from "./useMarketAssetPress";
import { useMarketAssets } from "./useMarketAssets";
import { type MarketCategories, useMarketCategories } from "./useMarketCategories";
import { useMarketHighlights, type MarketHighlights } from "./useMarketHighlights";
import { type MarketSearch, useMarketSearch } from "./useMarketSearch";

export type { MarketHighlightCard } from "./useMarketHighlights";

export type { MarketCategories, MarketCategoryTab } from "./useMarketCategories";

export type MarketScreenAssetsList = {
  assets: MarketAssetDisplayData[];
  assetsLoading: boolean;
  assetsLoadingMore: boolean;
  assetsError: boolean;
  assetsEmptyState: "favorites" | undefined;
  categories: MarketCategories;
  onAssetPress: (asset: MarketAssetDisplayData) => void;
  onEndReached: () => void;
};

export type MarketScreenViewModel = {
  search: Pick<MarketSearch, "value" | "onChangeText" | "onClear">;
  highlights: MarketHighlights;
  assetsList: MarketScreenAssetsList;
  isSearchActive: boolean;
};

export function useMarketScreenViewModel(): MarketScreenViewModel {
  const search = useMarketSearch();
  const highlights = useMarketHighlights();
  const categories = useMarketCategories();
  const starredMarketCoins = useSelector(starredMarketCoinsSelector);
  const { assets, loading, loadingMore, isError, emptyState, onEndReached } = useMarketAssets({
    search: search.query,
    category: categories.selectedCategory,
    starredMarketCoins,
  });
  const onAssetPress = useMarketAssetPress();

  return {
    search: {
      value: search.value,
      onChangeText: search.onChangeText,
      onClear: search.onClear,
    },
    highlights,
    assetsList: {
      assets: search.isDebouncing ? [] : assets,
      assetsLoading: search.isDebouncing || loading,
      assetsLoadingMore: loadingMore,
      assetsError: isError,
      assetsEmptyState: search.isDebouncing ? undefined : emptyState,
      categories,
      onAssetPress,
      onEndReached,
    },
    isSearchActive: search.isActive,
  };
}
