import { useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useStockAssetIds } from "@ledgerhq/live-common/dada-client/hooks/useStockAssetIds";
import {
  useCategorizedAssets,
  type CategorizedAssetItem,
} from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import VersionNumber from "react-native-version-number";
import { useDistribution } from "~/actions/general";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";

export function useCategorizedAssetsFromPortfolio() {
  const { shouldDisplayAggregatedAssets, shouldDisplayAssetDiscoverability } =
    useWalletFeaturesConfig("mobile");
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const version = VersionNumber.appVersion ?? "";

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
    groupBy: shouldDisplayAggregatedAssets ? "asset" : undefined,
  });

  const {
    tickers: stablecoinTickers,
    isLoading: isLoadingStablecoinTickers,
    isError: isStablecoinTickersError,
  } = useStablecoinTickers("llm", version);

  const {
    ids: stockAssetIds,
    isLoading: isLoadingStockIds,
    isError: isStockIdsError,
  } = useStockAssetIds("llm", version, !shouldDisplayAssetDiscoverability);

  const categorizedAssets = useCategorizedAssets(distribution, stablecoinTickers);

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const filteredCategorizedAssets = useMemo(() => {
    const cryptos: CategorizedAssetItem[] = [];
    const stocks: CategorizedAssetItem[] = [];

    for (const item of categorizedAssets.cryptos) {
      if (blacklistedTokenIdsSet.has(item.currency.id)) continue;
      if (shouldDisplayAssetDiscoverability && stockAssetIds.has(item.currency.id))
        stocks.push(item);
      else cryptos.push(item);
    }

    const stablecoins = categorizedAssets.stablecoins.filter(
      ({ currency }) => !blacklistedTokenIdsSet.has(currency.id),
    );

    return { cryptos, stablecoins, stocks };
  }, [categorizedAssets, blacklistedTokenIdsSet, stockAssetIds, shouldDisplayAssetDiscoverability]);

  return {
    categorizedAssets: filteredCategorizedAssets,
    isLoadingStablecoinTickers: isLoadingStablecoinTickers || distribution.isLoading,
    isStablecoinTickersError,
    stablecoinTickers,
    isLoadingStocks: isLoadingStockIds || distribution.isLoading,
    isStocksError: isStockIdsError,
  };
}
