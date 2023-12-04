import BigNumber from "bignumber.js";
import { OnNoRatesCallback, RatesReducerState, SwapSelectorStateType } from "../../types";
import { useFetchRates } from "./useFetchRates";
import { SetExchangeRateCallback } from "../useSwapTransaction";
import { useFeature } from "../../../../featureFlags";
import { useCallback } from "react";

type Props = {
  fromState: SwapSelectorStateType;
  toState: SwapSelectorStateType;
  onNoRates?: OnNoRatesCallback;
  setExchangeRate?: SetExchangeRateCallback | null | undefined;
};

export type UseProviderRatesResponse = {
  rates: RatesReducerState;
  refetchRates(): void;
  updateSelectedRate(): void;
};

export function useProviderRates({
  fromState,
  toState,
  onNoRates,
  setExchangeRate,
}: Props): UseProviderRatesResponse {
  const ptxSwapMoonpayProviderFlag = useFeature("ptxSwapMoonpayProvider");
  const filterMoonpay = useCallback(
    rates => {
      if (!rates || ptxSwapMoonpayProviderFlag?.enabled) return rates;
      return rates.filter(r => r.provider !== "moonpay");
    },
    [ptxSwapMoonpayProviderFlag?.enabled],
  );

  const { data, isLoading, error, refetch } = useFetchRates({
    fromCurrencyAccount: fromState.account,
    toCurrency: toState.currency,
    fromCurrencyAmount: fromState.amount ?? BigNumber(0),
    onSuccess(data) {
      const rates = filterMoonpay(data);
      if (rates.length === 0) {
        onNoRates?.({ fromState, toState });
      } else {
        setExchangeRate?.(rates[0]);
      }
    },
  });

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
    };
  }

  if (data) {
    return {
      rates: {
        status: "success",
        value: filterMoonpay(data),
        error: undefined,
      },
      refetchRates: refetch,
      updateSelectedRate: () => undefined,
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
  };
}
