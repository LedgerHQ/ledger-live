import { useDistribution } from "~/renderer/actions/general";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useCategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { useSelector } from "LLD/hooks/redux";
import { hideEmptyTokenAccountsSelector } from "~/renderer/reducers/settings";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";

export function useCategorizedAssetsFromPortfolio() {
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
    groupBy: shouldDisplayAggregatedAssets ? "asset" : undefined,
  });

  const { tickers: stablecoinTickers, isLoading: isLoadingStablecoinTickers } =
    useStablecoinTickers("lld", __APP_VERSION__);
  const categorizedAssets = useCategorizedAssets(distribution, stablecoinTickers);
  return {
    categorizedAssets,
    isLoadingStablecoinTickers: isLoadingStablecoinTickers || distribution.isLoading,
    stablecoinTickers,
  };
}
