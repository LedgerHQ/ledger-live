import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useMarketcapIds, useTrackingPairsForTopCoins } from "@ledgerhq/live-countervalues-react";
import { TrackingPair } from "@ledgerhq/live-countervalues/types";
import {
  marketPerformanceWidgetSelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { getPortfolioRangeConfig } from "@ledgerhq/live-countervalues/portfolio";
import { Currency } from "@ledgerhq/types-cryptoassets";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { BASIC_REFETCH } from "../screens/market/utils";

export function useMarketPerformanceFeatureFlag() {
  const marketPerformanceValue = useSelector(marketPerformanceWidgetSelector);
  const marketperformanceWidgetDesktop = useFeature("marketperformanceWidgetDesktop");
  return {
    enabled: (marketperformanceWidgetDesktop?.enabled && marketPerformanceValue) || false,
    variant: marketperformanceWidgetDesktop?.params?.variant || ABTestingVariants.variantA,
    refreshRate: marketperformanceWidgetDesktop?.params?.refreshRate || BASIC_REFETCH,
    top: marketperformanceWidgetDesktop?.params?.top || 100,
    limit: marketperformanceWidgetDesktop?.params?.limit || 100,
    supported: marketperformanceWidgetDesktop?.params?.supported || false,
    enableNewFeature: marketperformanceWidgetDesktop?.params?.enableNewFeature || false,
  };
}

export function useMarketPerformanceReferenceDate() {
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  return useMemo(() => {
    // TODO getPortfolioRangeConfig should return null if the range is not supported
    const conf = getPortfolioRangeConfig(selectedTimeRange === "all" ? "year" : selectedTimeRange);
    return conf?.startOf(new Date(Date.now() - (conf?.count || 0) * conf?.increment));
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
