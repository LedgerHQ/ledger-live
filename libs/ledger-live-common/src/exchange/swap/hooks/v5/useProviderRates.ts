import BigNumber from "bignumber.js";
import { OnNoRatesCallback, RatesReducerState, SwapSelectorStateType } from "../../types";
import { useFetchRates } from "./useFetchRates";
import { SetExchangeRateCallback } from "../useSwapTransaction";
import { useEffect } from "react";
import { useCountdown } from "usehooks-ts";
import { DEFAULT_SWAP_RATES_INTERVAL_MS } from "../../const/timeout";

type Props = {
  fromState: SwapSelectorStateType;
  toState: SwapSelectorStateType;
  onNoRates?: OnNoRatesCallback;
  setExchangeRate?: SetExchangeRateCallback | null | undefined;
  countdown?: number;
  allowRefresh?: boolean;
  isEnabled?: boolean;
};

export type UseProviderRatesResponse = {
  rates: RatesReducerState;
  refetchRates(): void;
  updateSelectedRate(): void;
  countdown: undefined | number;
};

export function useProviderRates({
  fromState,
  toState,
  onNoRates,
  setExchangeRate,
  allowRefresh = true,
  isEnabled = true,
  ...props
}: Props): UseProviderRatesResponse {
  const [countdown, { startCountdown, resetCountdown, stopCountdown }] = useCountdown({
    countStart: props.countdown ?? DEFAULT_SWAP_RATES_INTERVAL_MS / 1000,
    countStop: 0,
  });

  const { data, isLoading, error, refetch } = useFetchRates({
    fromCurrencyAccount: fromState.account,
    toCurrency: toState.currency,
    fromCurrencyAmount: fromState.amount ?? BigNumber(0),
    onSuccess(data) {
      resetCountdown();
      if (data.length === 0) {
        stopCountdown();
        onNoRates?.({ fromState, toState });
      } else {
        startCountdown();
        setExchangeRate?.(data[0]);
      }
    },
    isEnabled,
  });

  useEffect(() => {
    if (countdown <= 0 && allowRefresh) {
      refetch();
    }
  }, [countdown, refetch, allowRefresh]);

  if (!fromState.amount || fromState.amount.lte(0)) {
    setExchangeRate?.(undefined);
    return {
      rates: {
        status: "idle",
        value: [],
        error: undefined,
      },
      refetchRates: () => undefined,
      updateSelectedRate: () => undefined,
      countdown: undefined,
    };
  }

  if (isLoading) {
    setExchangeRate?.(undefined);
    return {
      rates: {
        status: "loading",
        value: [],
        error: undefined,
      },
      refetchRates: () => undefined,
      updateSelectedRate: () => undefined,
      countdown: undefined,
    };
  }
  if (error) {
    setExchangeRate?.(undefined);
    return {
      rates: {
        status: "error",
        value: [],
        error: error,
      },
      refetchRates: () => undefined,
      updateSelectedRate: () => undefined,
      countdown: undefined,
    };
  }

  if (data) {
    return {
      rates: {
        status: "success",
        value: data,
        error: undefined,
      },
      refetchRates: refetch,
      updateSelectedRate: () => undefined,
      countdown,
    };
  }

  return {
    rates: {
      status: "idle",
      value: [],
      error: undefined,
    },
    refetchRates: () => undefined,
    updateSelectedRate: () => undefined,
    countdown: undefined,
  };
}
