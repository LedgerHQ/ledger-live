import { useMemo } from "react";
import useEnv from "@features/platform-env";
import { useStablecoinTickers, useStockAssetIds } from "@features/platform-aggregated-assets";
import {
  useCategorizedAssets,
  type CategorizedAssetItem,
} from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { appVersion } from "LLM/utils/appVersion";
import { useDistribution } from "~/actions/general";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";

export function useCategorizedAssetsFromPortfolio() {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const version = appVersion;

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
    groupBy: "asset",
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
  } = useStockAssetIds("llm", version);

  const categorizedAssets = useCategorizedAssets(distribution, stablecoinTickers);

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const filteredCategorizedAssets = useMemo(() => {
    const cryptos: CategorizedAssetItem[] = [];
    const stocks: CategorizedAssetItem[] = [];

    for (const item of categorizedAssets.cryptos) {
      if (blacklistedTokenIdsSet.has(item.currency.id)) continue;
      if (stockAssetIds.has(item.currency.id)) stocks.push(item);
      else cryptos.push(item);
    }

    const stablecoins = categorizedAssets.stablecoins.filter(
      ({ currency }) => !blacklistedTokenIdsSet.has(currency.id),
    );

    return { cryptos, stablecoins, stocks };
  }, [categorizedAssets, blacklistedTokenIdsSet, stockAssetIds]);

  return {
    categorizedAssets: filteredCategorizedAssets,
    isLoadingStablecoinTickers: isLoadingStablecoinTickers || distribution.isLoading,
    isStablecoinTickersError,
    stablecoinTickers,
    isLoadingStocks: isLoadingStockIds || distribution.isLoading,
    isStocksError: isStockIdsError,
  };
}
