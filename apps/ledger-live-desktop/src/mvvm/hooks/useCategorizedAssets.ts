import { useDistribution } from "~/renderer/actions/general";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useCategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { useSelector } from "LLD/hooks/redux";
import { hideEmptyTokenAccountsSelector } from "~/renderer/reducers/settings";

export function useCategorizedAssetsFromPortfolio() {
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);
  const distribution = useDistribution({ showEmptyAccounts: true, hideEmptyTokenAccount });
  const { tickers: stablecoinTickers, isLoading: isLoadingStablecoinTickers } =
    useStablecoinTickers("lld", __APP_VERSION__);
  const categorizedAssets = useCategorizedAssets(distribution, stablecoinTickers);
  return {
    categorizedAssets,
    isLoadingStablecoinTickers,
    stablecoinTickers,
  };
}
