import { useMemo } from "react";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import type { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import { parseMarketListCategory } from "@ledgerhq/live-common/market/utils/category";
import { getMarketPageTracking } from "./marketTracking";
import { useMarketAssetPress } from "./useMarketAssetPress";
import { useMarketAssets } from "./useMarketAssets";
import { type MarketCategories, useMarketCategories } from "./useMarketCategories";
import { type MarketFilters, useMarketFilters } from "./useMarketFilters";
import { useMarketHighlights, type MarketHighlights } from "./useMarketHighlights";
import { type MarketSearch, useMarketSearch } from "./useMarketSearch";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { starredMarketCoinsSelector } from "~/reducers/settings";

type MarketScreenRoute = RouteProp<MarketNavigatorStackParamList, ScreenName.MarketList>;

export type { MarketHighlightCard } from "./useMarketHighlights";

export type { MarketCategories, MarketCategoryTab } from "./useMarketCategories";
export type { MarketFilters, MarketFilterOption } from "./useMarketFilters";

export type MarketScreenAssetsList = {
  assets: MarketAssetDisplayData[];
  assetsLoading: boolean;
  assetsFetchingNextPage: boolean;
  assetsError: boolean;
  assetsEmptyState: "favorites" | "stocks" | undefined;
  categories: MarketCategories;
  filters: MarketFilters;
  onAssetPress: (asset: MarketAssetDisplayData) => void;
  onEndReached: () => void;
};

export type MarketScreenViewModel = {
  search: Pick<MarketSearch, "value" | "onChangeText" | "onClear">;
  highlights: MarketHighlights;
  assetsList: MarketScreenAssetsList;
  isSearchActive: boolean;
  pageTracking: ReturnType<typeof getMarketPageTracking>;
};

export function useMarketScreenViewModel(): MarketScreenViewModel {
  const route = useRoute<MarketScreenRoute>();
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("mobile");
  const routeCategory = shouldDisplayAssetDiscoverability
    ? parseMarketListCategory(route.params?.category)
    : undefined;
  const search = useMarketSearch();
  const highlights = useMarketHighlights();
  const categories = useMarketCategories({ routeCategory });
  const filters = useMarketFilters();
  const starredMarketCoins = useSelector(starredMarketCoinsSelector);
  const { assets, loading, isFetchingNextPage, isError, emptyState, onEndReached } =
    useMarketAssets({
      search: search.query,
      category: categories.selectedCategory,
      sorting: filters.sorting,
      timeframe: filters.timeframe,
      starredMarketCoins,
    });
  const onAssetPress = useMarketAssetPress(categories.selectedCategory);

  const pageTracking = useMemo(
    () =>
      getMarketPageTracking({
        sorting: filters.sorting,
        timeframe: filters.timeframe,
        category: categories.selectedCategory,
      }),
    [filters.sorting, filters.timeframe, categories.selectedCategory],
  );

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
      assetsFetchingNextPage: !search.isDebouncing && isFetchingNextPage,
      assetsError: isError,
      assetsEmptyState: search.isDebouncing ? undefined : emptyState,
      categories,
      filters,
      onAssetPress,
      onEndReached,
    },
    isSearchActive: search.isActive,
    pageTracking,
  };
}
