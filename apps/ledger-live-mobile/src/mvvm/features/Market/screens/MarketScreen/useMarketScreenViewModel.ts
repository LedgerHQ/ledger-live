import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { useMarketAssetPress } from "./useMarketAssetPress";
import { useMarketAssets } from "./useMarketAssets";
import { useMarketHighlights, type MarketHighlights } from "./useMarketHighlights";

export type { MarketHighlightCard } from "./useMarketHighlights";

export type MarketScreenViewModel = MarketHighlights & {
  assets: MarketAssetDisplayData[];
  assetsLoading: boolean;
  assetsLoadingMore: boolean;
  assetsError: boolean;
  onAssetPress: (asset: MarketAssetDisplayData) => void;
  onEndReached: () => void;
};

export function useMarketScreenViewModel(): MarketScreenViewModel {
  const highlights = useMarketHighlights();
  const { assets, loading, loadingMore, isError, onEndReached } = useMarketAssets();
  const onAssetPress = useMarketAssetPress();

  return {
    ...highlights,
    assets,
    assetsLoading: loading,
    assetsLoadingMore: loadingMore,
    assetsError: isError,
    onAssetPress,
    onEndReached,
  };
}
