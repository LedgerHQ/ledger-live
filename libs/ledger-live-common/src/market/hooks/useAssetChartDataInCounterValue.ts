import { useMemo } from "react";
import { useUsdToFiatRate } from "../../counterValues/hooks/useUsdToFiatRate";
import { scaleMarketChartData } from "../utils/scaleMarketChartData";
import type { MarketAssetChartDataRequestParams, MarketCoinDataChart } from "../utils/types";
import { useAssetChartData } from "./useMarketDataProvider";
import { useResolveMarketCounterCurrency } from "./useResolveMarketCounterCurrency";

export type UseAssetChartDataInCounterValueResult = {
  data: MarketCoinDataChart | undefined;
  // Data for the current args only; undefined until they load. Read this (not
  // `data`) on asset/range switch to avoid leaking the previous series.
  currentData: MarketCoinDataChart | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
};

/**
 * Fetch an asset's price chart in the user's countervalue. For countervalues the
 * chart endpoint can't serve (crypto, or fiats like COP) it fetches in USD and
 * rescales by the USD->countervalue rate; supported fiats are passed through.
 */
export function useAssetChartDataInCounterValue(
  { id, counterCurrency, range }: MarketAssetChartDataRequestParams,
  options?: { skip?: boolean },
): UseAssetChartDataInCounterValueResult {
  const { requestCounterCurrency, displayCounterCurrency, needsUsdFallback, isResolutionLoading } =
    useResolveMarketCounterCurrency({
      counterCurrency,
      fallbackForCryptoCountervalues: true,
    });
  const skipChart = options?.skip || isResolutionLoading;

  const { data, currentData, isLoading, isFetching, isError } = useAssetChartData(
    { id, counterCurrency: requestCounterCurrency, range },
    { skip: skipChart },
  );

  // Passing "usd" short-circuits the rate hook to 1 without a request.
  const { rate, status } = useUsdToFiatRate(
    needsUsdFallback ? (displayCounterCurrency ?? "usd") : "usd",
    { skip: skipChart },
  );

  const scaledData = useMemo(() => {
    if (skipChart) return undefined;
    if (!needsUsdFallback) return data;
    // Withhold data until the rate resolves, rather than showing USD as the countervalue.
    if (rate == null) return undefined;
    return scaleMarketChartData(data, rate);
  }, [data, needsUsdFallback, rate, skipChart]);

  const scaledCurrentData = useMemo(() => {
    if (skipChart) return undefined;
    if (!needsUsdFallback) return currentData;
    if (rate == null) return undefined;
    return scaleMarketChartData(currentData, rate);
  }, [currentData, needsUsdFallback, rate, skipChart]);

  return {
    data: scaledData,
    currentData: scaledCurrentData,
    isLoading: isLoading || isResolutionLoading || (needsUsdFallback && status === "loading"),
    isFetching,
    isError: isError || (needsUsdFallback && status === "error"),
  };
}
