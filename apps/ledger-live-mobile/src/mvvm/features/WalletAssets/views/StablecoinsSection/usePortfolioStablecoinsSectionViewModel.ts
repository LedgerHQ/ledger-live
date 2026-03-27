import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";
import { useDefaultAssetsByCategory } from "LLM/hooks/useDefaultAssetsByCategory";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { usePortfolioSectionActions } from "LLM/features/WalletAssets/shared/usePortfolioSectionActions";
import { toAsset, padAssetsWithDefaults } from "LLM/features/WalletAssets/shared/assetUtils";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";

export const MAX_STABLECOINS_TO_DISPLAY = 6;
export const EMPTY_STATE_MAX_STABLECOINS = 2;

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
  const isEmptyState = variant === "emptyState";
  const isReadOnly = variant === "readOnly";
  const { onPressShowAll, onItemPress } = usePortfolioSectionActions(isReadOnly);

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

  // Pad with placeholder stablecoins from the DADA API when the user owns fewer
  // than EMPTY_STATE_MAX_STABLECOINS, matching the desktop behaviour.
  const needsPadding =
    isEmptyState || isReadOnly || filteredStablecoins.length < EMPTY_STATE_MAX_STABLECOINS;
  const {
    stablecoins: defaultStablecoins,
    isLoading,
    isError,
  } = useDefaultAssetsByCategory(needsPadding, stablecoinTickers, 0, EMPTY_STATE_MAX_STABLECOINS);

  const assets = useMemo<Asset[]>(() => {
    if (isEmptyState || isReadOnly) return defaultStablecoins;
    return padAssetsWithDefaults(
      filteredStablecoins,
      defaultStablecoins,
      EMPTY_STATE_MAX_STABLECOINS,
    );
  }, [isEmptyState, isReadOnly, defaultStablecoins, filteredStablecoins]);

  const assetsCount = assets.length;

  const maxToDisplay =
    isEmptyState || isReadOnly ? EMPTY_STATE_MAX_STABLECOINS : MAX_STABLECOINS_TO_DISPLAY;

  const assetsToDisplay = useMemo(() => assets.slice(0, maxToDisplay), [assets, maxToDisplay]);

  const hasMore = useMemo(() => {
    if (isEmptyState || isReadOnly) return false;
    return filteredStablecoins.length > MAX_STABLECOINS_TO_DISPLAY;
  }, [isEmptyState, isReadOnly, filteredStablecoins.length]);

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
