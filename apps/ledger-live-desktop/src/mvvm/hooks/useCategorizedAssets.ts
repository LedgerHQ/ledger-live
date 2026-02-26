import { useDistribution } from "~/renderer/actions/general";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useCategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/index";

export function useCategorizedAssetsFromPortfolio() {
  const distribution = useDistribution({ hideEmptyTokenAccount: true });
  const marketData: Record<string, { price?: number; priceChangePercentage24h?: number }> = {
    bitcoin: { price: 97000, priceChangePercentage24h: 2.3 },
    ethereum: { price: 2700, priceChangePercentage24h: -1.17 },
  };
  const { tickers: stablecoinTickers, isLoading: isLoadingStablecoinTickers } =
    useStablecoinTickers("lld");
  const categorizedAssets = useCategorizedAssets(distribution, marketData, stablecoinTickers);
  return {
    categorizedAssets,
    isLoadingStablecoinTickers,
  };
}
