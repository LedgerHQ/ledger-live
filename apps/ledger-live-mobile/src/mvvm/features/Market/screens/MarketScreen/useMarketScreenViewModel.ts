import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { useMarketAssetPress } from "./useMarketAssetPress";
import { useMarketAssets } from "./useMarketAssets";
import { useMarketHighlights, type MarketHighlights } from "./useMarketHighlights";
import { type MarketSearch, useMarketSearch } from "./useMarketSearch";

export type { MarketHighlightCard } from "./useMarketHighlights";

export type MarketScreenAssetsList = {
  assets: MarketAssetDisplayData[];
  assetsLoading: boolean;
  assetsLoadingMore: boolean;
  assetsError: boolean;
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
  const { assets, loading, loadingMore, isError, onEndReached } = useMarketAssets({
    search: search.query,
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
      onAssetPress,
      onEndReached,
    },
    isSearchActive: search.isActive,
  };
}
