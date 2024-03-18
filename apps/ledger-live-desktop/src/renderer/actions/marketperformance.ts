import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useMarketcapIds, useTrackingPairsForTopCoins } from "@ledgerhq/live-countervalues-react";
import { TrackingPair } from "@ledgerhq/live-countervalues/types";
import { selectedTimeRangeSelector } from "~/renderer/reducers/settings";
import { getPortfolioRangeConfig } from "@ledgerhq/live-countervalues/portfolio";
import { Currency } from "@ledgerhq/types-cryptoassets";

export function useMarketPerformanceFeatureFlag() {
  // TODO hook to the actual Feature Flag.
  return {
    enabled: false,
  };
}

export function useMarketPerformanceReferenceDate() {
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  return useMemo(() => {
    const conf = getPortfolioRangeConfig(selectedTimeRange === "all" ? "year" : selectedTimeRange);
    return conf.startOf(new Date(Date.now() - (conf.count || 0) * conf.increment));
  }, [selectedTimeRange]);
}

export function useMarketPerformanceTrackingPairs(countervalue: Currency): TrackingPair[] {
  const size = 50;
  const refDate = useMarketPerformanceReferenceDate();
  const marketPerformanceEnabled = useMarketPerformanceFeatureFlag().enabled;
  const marketcapIds = useMarketcapIds();
  return useTrackingPairsForTopCoins(
    marketcapIds,
    countervalue,
    size,
    marketPerformanceEnabled ? refDate : undefined, // undefined will disable the cost of this hook
  );
}
