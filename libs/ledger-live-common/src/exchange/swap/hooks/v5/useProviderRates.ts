import BigNumber from "bignumber.js";
import { OnNoRatesCallback, RatesReducerState, SwapSelectorStateType } from "../../types";
import { useFetchRates } from "./useFetchRates";
import { SetExchangeRateCallback } from "../useSwapTransaction";

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
  const { data, isLoading, error, refetch } = useFetchRates({
    fromCurrencyAccount: fromState.account,
    toCurrency: toState.currency,
    fromCurrencyAmount: fromState.amount ?? BigNumber(0),
    onSuccess(data) {
      if (data.length === 0) {
        onNoRates?.({ fromState, toState });
      } else {
        setExchangeRate?.(data[0]);
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
