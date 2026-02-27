import { useDistribution } from "~/renderer/actions/general";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useCategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/index";

export function useCategorizedAssetsFromPortfolio() {
  const distribution = useDistribution({ hideEmptyTokenAccount: true });
  const { tickers: stablecoinTickers, isLoading: isLoadingStablecoinTickers } =
    useStablecoinTickers("lld");
  const categorizedAssets = useCategorizedAssets(distribution, stablecoinTickers);
  return {
    categorizedAssets,
    isLoadingStablecoinTickers,
  };
}
