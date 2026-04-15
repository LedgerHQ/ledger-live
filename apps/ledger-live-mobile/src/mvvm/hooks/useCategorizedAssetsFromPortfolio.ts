import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useCategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/index";
import VersionNumber from "react-native-version-number";
import { useDistribution } from "~/actions/general";

export function useCategorizedAssetsFromPortfolio() {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const distribution = useDistribution({ showEmptyAccounts: true, hideEmptyTokenAccount });

  const {
    tickers: stablecoinTickers,
    isLoading: isLoadingStablecoinTickers,
    isError: isStablecoinTickersError,
  } = useStablecoinTickers("llm", VersionNumber.appVersion ?? "");

  const categorizedAssets = useCategorizedAssets(distribution, stablecoinTickers);

  return {
    categorizedAssets,
    isLoadingStablecoinTickers,
    isStablecoinTickersError,
    stablecoinTickers,
  };
}
