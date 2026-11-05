import { useUsdToFiatRate } from "@features/platform-market-countervalues";
import {
  useResolveMarketCounterCurrency,
  type MarketCounterCurrencyResolution,
} from "./useResolveMarketCounterCurrency";

type UseMarketCounterValueRateParams = {
  counterCurrency: string | undefined;
  isCryptoCountervalue: boolean;
  fallbackForCryptoCountervalues?: boolean;
  skip?: boolean;
};

export type MarketCounterValueRate = MarketCounterCurrencyResolution & {
  /** `1` when no rescale is needed, `null` while the USD rate is loading. */
  rate: number | null;
  isLoading: boolean;
  isError: boolean;
};

/**
 * Resolves the currency sent to the market API and the rate that turns a USD
 * response back into the user's counter value. `skip` avoids the rate request
 * when the caller only needs the allowlist.
 */
export function useMarketCounterValueRate({
  counterCurrency,
  isCryptoCountervalue,
  fallbackForCryptoCountervalues = false,
  skip = false,
}: UseMarketCounterValueRateParams): MarketCounterValueRate {
  const resolution = useResolveMarketCounterCurrency({
    counterCurrency,
    fallbackForCryptoCountervalues,
    isCryptoCountervalue,
  });
  const { displayCounterCurrency, needsUsdFallback, isResolutionLoading } = resolution;
  const { rate: usdToCounterValueRate, status } = useUsdToFiatRate(
    needsUsdFallback ? (displayCounterCurrency ?? "usd") : "usd",
    { skip: skip || isResolutionLoading },
  );
  const rate = needsUsdFallback ? usdToCounterValueRate : 1;

  return {
    ...resolution,
    rate,
    isLoading: isResolutionLoading || (needsUsdFallback && status === "loading"),
    isError: needsUsdFallback && status === "error",
  };
}
