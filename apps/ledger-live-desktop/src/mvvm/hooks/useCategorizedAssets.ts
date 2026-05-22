import { useMemo } from "react";
import { useDistribution } from "~/renderer/actions/general";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useCategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { useSelector } from "LLD/hooks/redux";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";

export function useCategorizedAssetsFromPortfolio() {
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
    groupBy: shouldDisplayAggregatedAssets ? "asset" : undefined,
  });

  const { tickers: stablecoinTickers, isLoading: isLoadingStablecoinTickers } =
    useStablecoinTickers("lld", __APP_VERSION__);
  const rawCategorizedAssets = useCategorizedAssets(distribution, stablecoinTickers);

  const categorizedAssets = useMemo(() => {
    if (!blacklistedTokenIds?.length) return rawCategorizedAssets;
    const isVisible = (item: { currency: { id: string } }) =>
      !blacklistedTokenIds.includes(item.currency.id);
    return {
      ...rawCategorizedAssets,
      cryptos: rawCategorizedAssets.cryptos.filter(isVisible),
      stablecoins: rawCategorizedAssets.stablecoins.filter(isVisible),
    };
  }, [rawCategorizedAssets, blacklistedTokenIds]);

  return {
    categorizedAssets,
    isLoadingStablecoinTickers: isLoadingStablecoinTickers || distribution.isLoading,
    stablecoinTickers,
  };
}
