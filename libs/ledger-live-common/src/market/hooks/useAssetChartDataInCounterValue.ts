import { useMemo } from "react";
import { findCryptoCurrencyByTicker } from "@ledgerhq/cryptoassets";
import { useSupportedCounterCurrencies } from "../../cg-client/hooks/useCoingeckoDataProvider";
import { useUsdToFiatRate } from "../../counterValues/hooks/useUsdToFiatRate";
import { scaleMarketChartData } from "../utils/scaleMarketChartData";
import type { MarketAssetChartDataRequestParams, MarketCoinDataChart } from "../utils/types";
import { useAssetChartData } from "./useMarketDataProvider";

export type UseAssetChartDataInCounterValueResult = {
  data: MarketCoinDataChart | undefined;
  // Data for the current args only; undefined until they load. Read this (not
  // `data`) on asset/range switch to avoid leaking the previous series.
  currentData: MarketCoinDataChart | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
};

// The chart endpoint only serves a fiat `to` that CoinGecko supports, so fall
// back to USD for crypto (BTC/ETH are listed as vs_currencies) and unsupported
// fiats (e.g. COP). BTC is a pseudo-fiat, so crypto is detected via the registry.
// While the supported list loads, request fiats natively.
function useNeedsUsdFallback(counterCurrency: string | undefined): boolean {
  const { data: supportedCounterCurrencies } = useSupportedCounterCurrencies();

  if (!counterCurrency) return false;
  if (findCryptoCurrencyByTicker(counterCurrency.toUpperCase())) return true;

  const ticker = counterCurrency.toLowerCase();
  return supportedCounterCurrencies ? !supportedCounterCurrencies.includes(ticker) : false;
}

/**
 * Fetch an asset's price chart in the user's countervalue. For countervalues the
 * chart endpoint can't serve (crypto, or fiats like COP) it fetches in USD and
 * rescales by the USD->countervalue rate; supported fiats are passed through.
 */
export function useAssetChartDataInCounterValue(
  { id, counterCurrency, range }: MarketAssetChartDataRequestParams,
  options?: { skip?: boolean },
): UseAssetChartDataInCounterValueResult {
  const needsUsdFallback = useNeedsUsdFallback(counterCurrency);
  const requestCounterCurrency = needsUsdFallback ? "usd" : counterCurrency;

  const { data, currentData, isLoading, isFetching, isError } = useAssetChartData(
    { id, counterCurrency: requestCounterCurrency, range },
    options,
  );

  // Passing "usd" short-circuits the rate hook to 1 without a request.
  const { rate, status } = useUsdToFiatRate(needsUsdFallback ? counterCurrency ?? "usd" : "usd");

  const scaledData = useMemo(() => {
    if (!needsUsdFallback) return data;
    // Withhold data until the rate resolves, rather than showing USD as the countervalue.
    if (rate == null) return undefined;
    return scaleMarketChartData(data, rate);
  }, [data, needsUsdFallback, rate]);

  const scaledCurrentData = useMemo(() => {
    if (!needsUsdFallback) return currentData;
    if (rate == null) return undefined;
    return scaleMarketChartData(currentData, rate);
  }, [currentData, needsUsdFallback, rate]);

  return {
    data: scaledData,
    currentData: scaledCurrentData,
    isLoading: isLoading || (needsUsdFallback && status === "loading"),
    isFetching,
    isError: isError || (needsUsdFallback && status === "error"),
  };
}
