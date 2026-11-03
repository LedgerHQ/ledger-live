import { useMemo } from "react";
import { scaleMarketChartData } from "../utils/scaleMarketChartData";
import type { MarketAssetChartDataRequestParams, MarketCoinDataChart } from "../utils/types";
import { useAssetChartData, type UseAssetChartDataOptions } from "./useAssetChartData";
import { useMarketCounterValueRate } from "./useMarketCounterValueRate";

type UseAssetChartDataInCounterValueParams = MarketAssetChartDataRequestParams & {
  isCryptoCountervalue: boolean;
};

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
 * Fetch an asset's price chart in the user's countervalue. Currencies the chart
 * endpoint cannot serve, and crypto counter values, are fetched in USD and
 * rescaled by the USD->countervalue rate.
 */
export function useAssetChartDataInCounterValue(
  { id, counterCurrency, range, isCryptoCountervalue }: UseAssetChartDataInCounterValueParams,
  options?: UseAssetChartDataOptions,
): UseAssetChartDataInCounterValueResult {
  const {
    requestCounterCurrency,
    rate,
    isResolutionLoading,
    isLoading: isCounterValueLoading,
    isError: isCounterValueError,
  } = useMarketCounterValueRate({
    counterCurrency,
    fallbackForCryptoCountervalues: true,
    isCryptoCountervalue,
    skip: options?.skip,
  });
  const skipChart = options?.skip || isResolutionLoading;

  const { data, currentData, isLoading, isFetching, isError } = useAssetChartData(
    { id, counterCurrency: requestCounterCurrency, range },
    {
      skip: skipChart,
      ...(options?.pollingInterval !== undefined
        ? { pollingInterval: options.pollingInterval }
        : {}),
    },
  );

  const canScale = !skipChart && rate != null;
  const scaledData = useMemo(
    () => (canScale ? scaleMarketChartData(data, rate) : undefined),
    [data, rate, canScale],
  );
  const scaledCurrentData = useMemo(
    () => (canScale ? scaleMarketChartData(currentData, rate) : undefined),
    [currentData, rate, canScale],
  );

  return {
    data: scaledData,
    currentData: scaledCurrentData,
    isLoading: isLoading || isCounterValueLoading,
    isFetching,
    isError: isError || isCounterValueError,
  };
}
