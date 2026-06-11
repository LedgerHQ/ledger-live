import { useMemo } from "react";
import { Asset } from "~/types/asset";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { usePortfolioSectionActions } from "LLM/features/WalletAssets/shared/usePortfolioSectionActions";
import { toAsset } from "LLM/features/WalletAssets/shared/assetUtils";
import { MAX_STOCKS_TO_DISPLAY } from "LLM/features/WalletAssets/constants";

export interface PortfolioStocksSectionViewModelResult {
  stocksCount: number;
  hasMore: boolean;
  stocksToDisplay: Asset[];
  isLoading: boolean;
  isError: boolean;
  onPressShowAll: () => void;
  onItemPress: (asset: Asset) => void;
}

const usePortfolioStocksSectionViewModel = (): PortfolioStocksSectionViewModelResult => {
  const { onPressShowAll, onItemPress } = usePortfolioSectionActions(false, "stocks");
  const { categorizedAssets, isLoadingStockTickers, isStockTickersError } =
    useCategorizedAssetsFromPortfolio();

  const stocks = useMemo<Asset[]>(
    () => categorizedAssets.stocks.map(toAsset),
    [categorizedAssets.stocks],
  );

  const stocksCount = stocks.length;
  const stocksToDisplay = useMemo(() => stocks.slice(0, MAX_STOCKS_TO_DISPLAY), [stocks]);
  const hasMore = stocksCount > MAX_STOCKS_TO_DISPLAY;

  return {
    stocksCount,
    hasMore,
    stocksToDisplay,
    isLoading: isLoadingStockTickers,
    isError: isStockTickersError,
    onPressShowAll,
    onItemPress,
  };
};

export default usePortfolioStocksSectionViewModel;
