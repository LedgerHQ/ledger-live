import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";
import { useDefaultAssetsByCategory } from "LLM/hooks/useDefaultAssetsByCategory";
import { useReadOnlyCoins } from "~/hooks/useReadOnlyCoins";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import {
  toAsset,
  usePortfolioSectionActions,
} from "LLM/features/WalletAssets/shared/usePortfolioSectionActions";

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
  isEmptyState?: boolean;
  isReadOnly?: boolean;
}

const usePortfolioCryptosSectionViewModel = ({
  isEmptyState = false,
  isReadOnly = false,
}: UsePortfolioCryptosSectionViewModelOptions = {}): PortfolioCryptosSectionViewModelResult => {
  const { onPressShowAll, onItemPress } = usePortfolioSectionActions(isReadOnly);

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

  const {
    cryptos: defaultAssets,
    isLoading,
    isError,
  } = useDefaultAssetsByCategory(isEmptyState, stablecoinTickers, EMPTY_STATE_MAX_ASSETS, 0);

  const { sortedCryptoCurrencies } = useReadOnlyCoins({ maxDisplayed: READ_ONLY_MAX_ASSETS });
  const readOnlyAssets = useMemo<Asset[]>(
    () =>
      sortedCryptoCurrencies
        .filter(currency => !stablecoinTickers.has(currency.ticker.toUpperCase()))
        .map(currency => ({ amount: 0, accounts: [], currency })),
    [sortedCryptoCurrencies, stablecoinTickers],
  );

  const assets = useMemo<Asset[]>(() => {
    if (isEmptyState) return defaultAssets;
    if (isReadOnly) return readOnlyAssets;
    return filteredAssets;
  }, [isEmptyState, isReadOnly, defaultAssets, readOnlyAssets, filteredAssets]);

  const assetsCount = assets.length;

  const assetsToDisplay = useMemo(
    () => assets.slice(0, isEmptyState ? EMPTY_STATE_MAX_ASSETS : MAX_ASSETS_TO_DISPLAY),
    [assets, isEmptyState],
  );

  const hasMore = useMemo(() => {
    if (isEmptyState) return false;
    if (isReadOnly) return true;
    return assetsCount > MAX_ASSETS_TO_DISPLAY;
  }, [isEmptyState, isReadOnly, assetsCount]);

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
