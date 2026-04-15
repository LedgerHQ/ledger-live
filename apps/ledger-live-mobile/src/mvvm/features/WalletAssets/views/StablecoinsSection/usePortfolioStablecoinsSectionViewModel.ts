import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";
import { useDefaultAssetsByCategory } from "LLM/hooks/useDefaultAssetsByCategory";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { usePortfolioSectionActions } from "LLM/features/WalletAssets/shared/usePortfolioSectionActions";
import { toAsset, padAssetsWithDefaults } from "LLM/features/WalletAssets/shared/assetUtils";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";
import {
  MAX_STABLECOINS_TO_DISPLAY,
  EMPTY_STATE_MAX_STABLECOINS,
} from "LLM/features/WalletAssets/constants";

export interface PortfolioStablecoinsSectionViewModelResult {
  assetsCount: number;
  hasMore: boolean;
  assetsToDisplay: Asset[];
  isLoading: boolean;
  isError: boolean;
  onPressShowAll: () => void;
  onItemPress: (asset: Asset) => void;
}

interface UsePortfolioStablecoinsSectionViewModelOptions {
  variant?: WalletAssetsVariant;
}

const usePortfolioStablecoinsSectionViewModel = ({
  variant = "normal",
}: UsePortfolioStablecoinsSectionViewModelOptions = {}): PortfolioStablecoinsSectionViewModelResult => {
  const isLimitedView = variant === "emptyState" || variant === "readOnly";
  const isReadOnly = variant === "readOnly";
  const { onPressShowAll, onItemPress } = usePortfolioSectionActions(isReadOnly, "stablecoin");

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const { categorizedAssets, stablecoinTickers } = useCategorizedAssetsFromPortfolio();

  const filteredStablecoins = useMemo(
    () =>
      categorizedAssets.stablecoins
        .filter(
          ({ currency }) =>
            currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id),
        )
        .map(toAsset),
    [categorizedAssets.stablecoins, blacklistedTokenIdsSet],
  );

  const needsPadding = isLimitedView || filteredStablecoins.length < EMPTY_STATE_MAX_STABLECOINS;
  const {
    stablecoins: defaultStablecoins,
    isLoading,
    isError,
  } = useDefaultAssetsByCategory(needsPadding, stablecoinTickers, 0, EMPTY_STATE_MAX_STABLECOINS);

  const assets = useMemo<Asset[]>(() => {
    if (isLimitedView) return defaultStablecoins;
    return padAssetsWithDefaults(
      filteredStablecoins,
      defaultStablecoins,
      EMPTY_STATE_MAX_STABLECOINS,
    );
  }, [isLimitedView, defaultStablecoins, filteredStablecoins]);

  const assetsCount = assets.length;

  const maxToDisplay = isLimitedView ? EMPTY_STATE_MAX_STABLECOINS : MAX_STABLECOINS_TO_DISPLAY;

  const assetsToDisplay = useMemo(() => assets.slice(0, maxToDisplay), [assets, maxToDisplay]);

  const hasMore = useMemo(() => {
    if (isLimitedView) return false;
    return filteredStablecoins.length > MAX_STABLECOINS_TO_DISPLAY;
  }, [isLimitedView, filteredStablecoins.length]);

  return {
    assetsCount,
    hasMore,
    assetsToDisplay,
    isLoading,
    isError,
    onPressShowAll,
    onItemPress,
  };
};

export default usePortfolioStablecoinsSectionViewModel;
