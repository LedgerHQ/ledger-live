import { useMemo } from "react";
import { useDistribution } from "~/renderer/actions/general";
import { useMarketByCurrencies } from "@ledgerhq/live-common/dada-client/hooks/useMarketByCurrencies";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useCategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/index";

export function useCategorizedAssetsFromPortfolio() {
  const distribution = useDistribution({ hideEmptyTokenAccount: true });
  const currencies = useMemo(() => distribution.list.map(i => i.currency), [distribution.list]);
  // 1D trend will need an explicit call to DADA client to get the price
  // this is just to hit the cache for RTK query market data
  const marketData = useMarketByCurrencies(currencies);
  const { tickers: stablecoinTickers, isLoading: isLoadingStablecoinTickers } =
    useStablecoinTickers("lld");
  const categorizedAssets = useCategorizedAssets(distribution, marketData, stablecoinTickers);
  return {
    categorizedAssets,
    isLoadingStablecoinTickers,
  };
}
