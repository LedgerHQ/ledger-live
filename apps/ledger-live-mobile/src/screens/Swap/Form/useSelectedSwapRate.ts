import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { rateSelector, updateRateAction } from "~/actions/swap";

type UseSelectedSwapRateProps = {
  defaultRate?: ExchangeRate;
  availableRates?: ExchangeRate[];
};

export function useSelectedSwapRate(props: UseSelectedSwapRateProps) {
  const { defaultRate, availableRates } = props;

  const dispatch = useDispatch();
  const exchangeRate = useSelector(rateSelector);

  const provider = useMemo(() => {
    // Prioritize provider from redux state over navigation parameter
    const targetProvider = exchangeRate?.provider ?? defaultRate?.provider;
    const fallback = availableRates?.at(0)?.provider;
    const hasProvider = availableRates?.some(item => item.provider === targetProvider);
    if (hasProvider) {
      return targetProvider;
    }
    // If target provider doesn't exists, fallback to first provider from available rates
    return fallback;
  }, [defaultRate, exchangeRate?.provider, availableRates]);

  const updateExchangeRate = useCallback(
    (rate?: ExchangeRate) => {
      dispatch(updateRateAction(rate));
    },
    [dispatch],
  );

  // Update rate using inputs provider only if new rate is different
  const onSelectRateFromProvider = useCallback(
    (inputs: { provider: ExchangeRate["provider"]; rates: ExchangeRate[] }) => {
      const targetRate = inputs.rates.find(item => item.provider === inputs.provider);

      // Compare rates
      const isDifferentProvider = provider !== exchangeRate?.provider;
      const isDifferentAmount = targetRate?.toAmount !== exchangeRate?.toAmount;
      const isDifferentTradeMethod = targetRate?.tradeMethod !== exchangeRate?.tradeMethod;
      const shouldUpdateRate = isDifferentProvider || isDifferentAmount || isDifferentTradeMethod;

      /**
       * Update rate if needed, due to having SwapTransaction in
       * dep array, this effect hook can be triggered per second
       */
      if (targetRate && shouldUpdateRate) {
        updateExchangeRate(targetRate);
      }
    },
    [
      updateExchangeRate,
      provider,
      exchangeRate?.provider,
      exchangeRate?.toAmount,
      exchangeRate?.tradeMethod,
    ],
  );

  useEffect(() => {
    // No rates, no point to continue
    if (!availableRates) return;

    switch (true) {
      //
      // Monitor default provider, if is different, we will attempt to update rate
      // (most likely from navigation parameters changed)
      //
      case defaultRate && defaultRate.provider !== provider:
        onSelectRateFromProvider({
          provider: defaultRate!.provider,
          rates: availableRates,
        });
        break;
      //
      // Update rate using calculated provider
      //
      case Boolean(provider):
        onSelectRateFromProvider({
          provider: provider!,
          rates: availableRates,
        });
        break;
      default:
        break;
    }
  }, [provider, defaultRate, availableRates, updateExchangeRate, onSelectRateFromProvider]);

  return {
    provider,
    updateExchangeRate,
    rate: exchangeRate?.rate,
  };
}
