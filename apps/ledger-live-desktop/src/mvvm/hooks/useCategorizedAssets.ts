import { useMemo } from "react";
import { useDistribution } from "~/renderer/actions/general";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useStockAssetIds } from "@ledgerhq/live-common/dada-client/hooks/useStockAssetIds";
import {
  useCategorizedAssets,
  type CategorizedAssetItem,
} from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { useSelector } from "LLD/hooks/redux";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";

export function useCategorizedAssetsFromPortfolio() {
  const { shouldDisplayAggregatedAssets, shouldDisplayAssetDiscoverability } =
    useWalletFeaturesConfig("desktop");
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
    groupBy: shouldDisplayAggregatedAssets ? "asset" : undefined,
  });

  const {
    tickers: stablecoinTickers,
    isLoading: isLoadingStablecoinTickers,
    isError: isStablecoinTickersError,
  } = useStablecoinTickers("lld", __APP_VERSION__);

  const {
    ids: stockAssetIds,
    isLoading: isLoadingStockIds,
    isError: isStockIdsError,
  } = useStockAssetIds("lld", __APP_VERSION__, !shouldDisplayAssetDiscoverability);

  const rawCategorizedAssets = useCategorizedAssets(distribution, stablecoinTickers);

  const blacklistedTokenIdsSet = useMemo(
    () => new Set(blacklistedTokenIds ?? []),
    [blacklistedTokenIds],
  );

  const categorizedAssets = useMemo(() => {
    const cryptos: CategorizedAssetItem[] = [];
    const stocks: CategorizedAssetItem[] = [];

    for (const item of rawCategorizedAssets.cryptos) {
      if (blacklistedTokenIdsSet.has(item.currency.id)) {
        continue;
      }
      if (shouldDisplayAssetDiscoverability && stockAssetIds.has(item.currency.id)) {
        stocks.push(item);
      } else {
        cryptos.push(item);
      }
    }

    const stablecoins = rawCategorizedAssets.stablecoins.filter(
      ({ currency }) => !blacklistedTokenIdsSet.has(currency.id),
    );

    return { cryptos, stablecoins, stocks };
  }, [
    rawCategorizedAssets,
    blacklistedTokenIdsSet,
    stockAssetIds,
    shouldDisplayAssetDiscoverability,
  ]);

  return {
    categorizedAssets,
    isLoadingStablecoinTickers: isLoadingStablecoinTickers || distribution.isLoading,
    isStablecoinTickersError,
    stablecoinTickers,
    isLoadingStocks: isLoadingStockIds || distribution.isLoading,
    isStocksError: isStockIdsError,
  };
}
