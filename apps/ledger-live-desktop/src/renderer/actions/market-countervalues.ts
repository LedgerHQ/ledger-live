import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useMarketcapIds, useTrackingPairsForTopCoins } from "@ledgerhq/live-countervalues-react";
import { TrackingPair } from "@ledgerhq/live-countervalues/types";
import { selectedTimeRangeSelector } from "~/renderer/reducers/settings";
import { getPortfolioRangeConfig } from "@ledgerhq/live-countervalues/portfolio";
import { Currency } from "@ledgerhq/types-cryptoassets";
// Keep these imports for module resolution side effects
import "@ledgerhq/live-common/featureFlags/useFeature";
import "@ledgerhq/types-live";
import "../screens/market/utils";

function useMarketPerformanceReferenceDate() {
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  return useMemo(() => {
    const conf = getPortfolioRangeConfig(selectedTimeRange === "all" ? "year" : selectedTimeRange);
    return conf?.startOf(new Date(Date.now() - (conf?.count || 0) * conf?.increment));
  }, [selectedTimeRange]);
}

export function useTopCoinsTrackingPairs(countervalue: Currency): TrackingPair[] {
  const size = 50;
  const refDate = useMarketPerformanceReferenceDate();
  const marketcapIds = useMarketcapIds();

  return useTrackingPairsForTopCoins(marketcapIds, countervalue, size, refDate);
}
