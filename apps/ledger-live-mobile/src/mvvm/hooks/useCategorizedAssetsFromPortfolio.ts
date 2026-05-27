import { useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useCategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";
import VersionNumber from "react-native-version-number";
import { useDistribution } from "~/actions/general";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";

export function useCategorizedAssetsFromPortfolio() {
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("mobile");
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
    groupBy: shouldDisplayAggregatedAssets ? "asset" : undefined,
  });

  const {
    tickers: stablecoinTickers,
    isLoading: isLoadingStablecoinTickers,
    isError: isStablecoinTickersError,
  } = useStablecoinTickers("llm", VersionNumber.appVersion ?? "");

  const categorizedAssets = useCategorizedAssets(distribution, stablecoinTickers);

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  // Exclude blacklisted assets so all portfolio-derived views share the same filtering rule.
  const filteredCategorizedAssets = useMemo(() => {
    if (blacklistedTokenIdsSet.size === 0) return categorizedAssets;
    return {
      cryptos: categorizedAssets.cryptos.filter(
        ({ currency }) => !blacklistedTokenIdsSet.has(currency.id),
      ),
      stablecoins: categorizedAssets.stablecoins.filter(
        ({ currency }) => !blacklistedTokenIdsSet.has(currency.id),
      ),
    };
  }, [categorizedAssets, blacklistedTokenIdsSet]);

  return {
    categorizedAssets: filteredCategorizedAssets,
    isLoadingStablecoinTickers: isLoadingStablecoinTickers || distribution.isLoading,
    isStablecoinTickersError,
    stablecoinTickers,
  };
}
