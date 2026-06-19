import { findCryptoCurrencyByTicker } from "@ledgerhq/cryptoassets";
import { useSupportedCounterCurrencies } from "../../cg-client/hooks/useCoingeckoDataProvider";

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
};

/**
 * Resolve the market endpoint countervalue. Unsupported fiat support depends on
 * CoinGecko's supported list; while it is loading, callers should skip fetching
 * so they don't fire a native request that will be replaced by the USD fallback.
 * If the supported list errors, the hook stops blocking and returns the user's value.
 */
export function useResolveMarketCounterCurrency({
  counterCurrency,
  fallbackForCryptoCountervalues = false,
}: UseResolveMarketCounterCurrencyParams): MarketCounterCurrencyResolution {
  const { data: supportedCounterCurrencies, isError } = useSupportedCounterCurrencies();
  const displayCounterCurrency = counterCurrency?.toLowerCase();
  const isUsd = displayCounterCurrency === "usd";
  const isCryptoCountervalue = Boolean(
    displayCounterCurrency && findCryptoCurrencyByTicker(displayCounterCurrency.toUpperCase()),
  );

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
