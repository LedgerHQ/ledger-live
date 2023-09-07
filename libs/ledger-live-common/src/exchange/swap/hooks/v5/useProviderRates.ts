import BigNumber from "bignumber.js";
import { OnNoRatesCallback, RatesReducerState, SwapSelectorStateType } from "../../types";
import { useFetchRates } from "./useFetchRates";
import { SetExchangeRateCallback } from "../useSwapTransaction";

type Props = {
  fromState: SwapSelectorStateType;
  toState: SwapSelectorStateType;
  onNoRates?: OnNoRatesCallback;
  onBeforeFetchRates?(): void;
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
  onBeforeFetchRates,
}: Props): UseProviderRatesResponse {
  const { data, isLoading, error, refetch } = useFetchRates({
    fromCurrencyAccount: fromState.account,
    toCurrency: toState.currency,
    fromCurrencyAmount: fromState.amount ?? BigNumber(0),
    onBeforeFetch: onBeforeFetchRates,
    onSuccess(data) {
      if (data.length === 0) {
        onNoRates?.({ fromState, toState });
      } else {
        setExchangeRate?.(data[0]);
      }
    },
  });

  if (!fromState.amount || fromState.amount.lte(0)) {
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
        value: data,
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
