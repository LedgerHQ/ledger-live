import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";
import { useDefaultAssetsByCategory } from "LLM/hooks/useDefaultAssetsByCategory";
import { useReadOnlyCoins } from "~/hooks/useReadOnlyCoins";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { usePortfolioSectionActions } from "LLM/features/WalletAssets/shared/usePortfolioSectionActions";
import { toAsset, padAssetsWithDefaults } from "LLM/features/WalletAssets/shared/assetUtils";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";

export const MAX_ASSETS_TO_DISPLAY = 6;
export const EMPTY_STATE_MAX_ASSETS = 4;
export const READ_ONLY_MAX_ASSETS = 5;

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
  const { onPressShowAll, onItemPress } = usePortfolioSectionActions(isReadOnly);
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("mobile");

  const isLimitedView = isEmptyState || (isReadOnly && shouldDisplayAssetSection);
  const isLegacyReadOnly = isReadOnly && !shouldDisplayAssetSection;

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const { categorizedAssets, stablecoinTickers } = useCategorizedAssetsFromPortfolio();

  const filteredAssets = useMemo(
    () =>
      categorizedAssets.cryptos
        .filter(
          ({ currency }) =>
            currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id),
        )
        .map(toAsset),
    [categorizedAssets.cryptos, blacklistedTokenIdsSet],
  );

  const needsDefaultAssets = isLimitedView || filteredAssets.length < EMPTY_STATE_MAX_ASSETS;
  const {
    cryptos: defaultAssets,
    isLoading: isDefaultLoading,
    isError: isDefaultError,
  } = useDefaultAssetsByCategory(needsDefaultAssets, stablecoinTickers, EMPTY_STATE_MAX_ASSETS, 0);

  const { sortedCryptoCurrencies } = useReadOnlyCoins({ maxDisplayed: READ_ONLY_MAX_ASSETS });
  const readOnlyAssets = useMemo<Asset[]>(
    () =>
      sortedCryptoCurrencies
        .filter(currency => !stablecoinTickers.has(currency.ticker.toUpperCase()))
        .map(currency => ({ amount: 0, accounts: [], currency })),
    [sortedCryptoCurrencies, stablecoinTickers],
  );

  const isLoading = isLegacyReadOnly ? false : isDefaultLoading;
  const isError = isLegacyReadOnly ? false : isDefaultError;

  const assets = useMemo<Asset[]>(() => {
    if (isLimitedView) return defaultAssets;
    if (isLegacyReadOnly) return readOnlyAssets;
    return padAssetsWithDefaults(filteredAssets, defaultAssets, EMPTY_STATE_MAX_ASSETS);
  }, [isLimitedView, isLegacyReadOnly, defaultAssets, readOnlyAssets, filteredAssets]);

  const assetsCount = assets.length;

  const assetsToDisplay = useMemo(
    () => assets.slice(0, isLimitedView ? EMPTY_STATE_MAX_ASSETS : MAX_ASSETS_TO_DISPLAY),
    [assets, isLimitedView],
  );

  const hasMore = useMemo(() => {
    if (isLimitedView) return false;
    if (isLegacyReadOnly) return true;
    return assetsCount > MAX_ASSETS_TO_DISPLAY;
  }, [isLimitedView, isLegacyReadOnly, assetsCount]);

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

export default usePortfolioCryptosSectionViewModel;
