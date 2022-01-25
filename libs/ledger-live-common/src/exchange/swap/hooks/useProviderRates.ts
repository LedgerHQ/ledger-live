import { useCallback, useEffect, useReducer, useState } from "react";
import {
  OnNoRatesCallback,
  SetExchangeRateCallback,
  SwapSelectorStateType,
} from "./useSwapTransaction";
import { getExchangeRates } from "..";
import { Exchange, ExchangeRate } from "../types";
import { pickExchangeRate } from "../utils";
import { Transaction } from "../../../generated/types";

export type RatesReducerState = {
  status?: string | null;
  value?: ExchangeRate[];
  error?: Error;
};

const ratesReducerInitialState: RatesReducerState = {};
const ratesReducer = (state: RatesReducerState, action): RatesReducerState => {
  switch (action.type) {
    case "set":
      return { value: action.payload, status: null };
    case "idle":
      return { ...state, status: null };
    case "loading":
      return { ...state, status: "loading" };
    case "error":
      return { status: "error", error: action.payload };
  }
  return state;
};

/* Fetch and update provider rates. */
export const useProviderRates = ({
  fromState,
  toState,
  exchangeRate,
  transaction,
  onNoRates,
  setExchangeRate,
}: {
  fromState: SwapSelectorStateType;
  toState: SwapSelectorStateType;
  exchangeRate?: ExchangeRate | null | undefined;
  transaction?: Transaction | null | undefined;
  onNoRates?: OnNoRatesCallback | null | undefined;
  setExchangeRate?: SetExchangeRateCallback | null | undefined;
}): {
  rates: RatesReducerState;
  refetchRates: () => void;
} => {
  const { account: fromAccount } = fromState;
  const { currency: toCurrency } = toState;
  const [rates, dispatchRates] = useReducer(
    ratesReducer,
    ratesReducerInitialState
  );
  const [getRatesDependency, setGetRatesDependency] = useState<unknown | null>(
    null
  );
  const refetchRates = useCallback(() => setGetRatesDependency({}), []);

  useEffect(
    () => {
      let abort = false;
      async function getRates() {
        if (
          !transaction ||
          !transaction?.amount ||
          !transaction?.amount.gt(0) ||
          !toCurrency ||
          !fromAccount
        ) {
          setExchangeRate && setExchangeRate(null);
          return dispatchRates({ type: "set", payload: [] });
        }
        dispatchRates({ type: "loading" });
        try {
          let rates: ExchangeRate[] = await getExchangeRates(
            { fromAccount } as Exchange,
            transaction,
            undefined,
            toCurrency
          );
          if (abort) return;
          if (rates.length === 0) {
            onNoRates && onNoRates({ fromState, toState });
          }
          // Discard bad provider rates
          let rateError: Error | null | undefined = null;
          rates = rates.reduce<ExchangeRate[]>((acc, rate) => {
            rateError = rateError ?? rate.error;
            return rate.error ? acc : [...acc, rate];
          }, []);
          if (rates.length === 0 && rateError) {
            // If all the rates are in error
            dispatchRates({ type: "error", payload: rateError });
          } else {
            dispatchRates({ type: "set", payload: rates });
            setExchangeRate &&
              pickExchangeRate(rates, exchangeRate, setExchangeRate);
          }
        } catch (error) {
          !abort && dispatchRates({ type: "error", payload: error });
        }
      }

      getRates();

      return () => {
        abort = true;
        dispatchRates({ type: "idle" });
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      fromAccount,
      toCurrency,
      transaction,
      getRatesDependency,
      onNoRates,
      setExchangeRate,
    ]
  );

  return {
    rates,
    refetchRates,
  };
};
