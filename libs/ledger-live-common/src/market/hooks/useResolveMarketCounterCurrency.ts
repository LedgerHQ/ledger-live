import { useGetSupportedChartCounterCurrenciesQuery } from "../state-manager/api";
import { ONE_DAY } from "../utils/timers";

export type MarketCounterCurrencyResolution = {
  requestCounterCurrency: string | undefined;
  displayCounterCurrency: string | undefined;
  needsUsdFallback: boolean;
  isResolutionLoading: boolean;
  supportedCounterCurrencies: string[] | undefined;
};

type UseResolveMarketCounterCurrencyParams = {
  counterCurrency: string | undefined;
  fallbackForCryptoCountervalues?: boolean;
  isCryptoCountervalue: boolean;
};

/**
 * Currencies absent from `/v3/supported/markets/chart/to` are requested in USD
 * and rescaled. A crypto counter value falls back to USD even when its ticker
 * is in that list. Callers skip the request while the list is loading. A list
 * error stops blocking and sends the user's currency.
 */
export function useResolveMarketCounterCurrency({
  counterCurrency,
  fallbackForCryptoCountervalues = false,
  isCryptoCountervalue,
}: UseResolveMarketCounterCurrencyParams): MarketCounterCurrencyResolution {
  const { data: supportedCounterCurrencies, isError } = useGetSupportedChartCounterCurrenciesQuery(
    undefined,
    {
      pollingInterval: ONE_DAY,
    },
  );
  const displayCounterCurrency = counterCurrency?.toLowerCase();
  const isUsd = displayCounterCurrency === "usd";
  const cryptoFallback = fallbackForCryptoCountervalues && isCryptoCountervalue;
  const unsupportedFiatFallback = Boolean(
    displayCounterCurrency &&
    supportedCounterCurrencies &&
    !supportedCounterCurrencies.includes(displayCounterCurrency),
  );
  const needsUsdFallback = cryptoFallback || unsupportedFiatFallback;
  const needsSupportedList =
    Boolean(displayCounterCurrency) && !isUsd && !cryptoFallback && !supportedCounterCurrencies;
  const isResolutionLoading = needsSupportedList && !isError;

  return {
    requestCounterCurrency: needsUsdFallback ? "usd" : displayCounterCurrency,
    displayCounterCurrency,
    needsUsdFallback,
    isResolutionLoading,
    supportedCounterCurrencies,
  };
}
