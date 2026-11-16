import { useMemo } from "react";
import { Asset } from "~/types/asset";
import { useDefaultAssetsByCategory } from "LLM/hooks/useDefaultAssetsByCategory";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { usePortfolioSectionActions } from "LLM/features/WalletAssets/shared/usePortfolioSectionActions";
import { toAsset, padAssetsWithDefaults } from "LLM/features/WalletAssets/shared/assetUtils";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";
import { MAX_ASSETS_TO_DISPLAY, EMPTY_STATE_MAX_ASSETS } from "LLM/features/WalletAssets/constants";

export interface PortfolioCryptosSectionViewModelResult {
  assetsCount: number;
  hasMore: boolean;
  assetsToDisplay: Asset[];
  isLoading: boolean;
  isError: boolean;
  onPressShowAll: () => void;
  onItemPress: (asset: Asset) => void;
}

interface UsePortfolioCryptosSectionViewModelOptions {
  variant?: WalletAssetsVariant;
}

const usePortfolioCryptosSectionViewModel = ({
  variant = "normal",
}: UsePortfolioCryptosSectionViewModelOptions = {}): PortfolioCryptosSectionViewModelResult => {
  const isEmptyState = variant === "emptyState";
  const isReadOnly = variant === "readOnly";
  const { onPressShowAll, onItemPress } = usePortfolioSectionActions(isReadOnly, "crypto");

  const isLimitedView = isEmptyState || isReadOnly;

  const { categorizedAssets, stablecoinTickers } = useCategorizedAssetsFromPortfolio();

  const filteredAssets = useMemo(
    () => categorizedAssets.cryptos.map(toAsset),
    [categorizedAssets.cryptos],
  );

  const needsDefaultAssets = isLimitedView || filteredAssets.length < EMPTY_STATE_MAX_ASSETS;
  const {
    cryptos: defaultAssets,
    isLoading: isDefaultLoading,
    isError: isDefaultError,
  } = useDefaultAssetsByCategory(needsDefaultAssets, stablecoinTickers, EMPTY_STATE_MAX_ASSETS, 0);

  const assets = useMemo<Asset[]>(() => {
    if (isLimitedView) return defaultAssets;
    return padAssetsWithDefaults(filteredAssets, defaultAssets, EMPTY_STATE_MAX_ASSETS);
  }, [isLimitedView, defaultAssets, filteredAssets]);

  const assetsCount = assets.length;

  const assetsToDisplay = useMemo(
    () => assets.slice(0, isLimitedView ? EMPTY_STATE_MAX_ASSETS : MAX_ASSETS_TO_DISPLAY),
    [assets, isLimitedView],
  );

  const hasMore = useMemo(() => {
    if (isLimitedView) return false;
    return assetsCount > MAX_ASSETS_TO_DISPLAY;
  }, [isLimitedView, assetsCount]);

  return {
    assetsCount,
    hasMore,
    assetsToDisplay,
    isLoading: isDefaultLoading,
    isError: isDefaultError,
    onPressShowAll,
    onItemPress,
  };
};

export default usePortfolioCryptosSectionViewModel;
