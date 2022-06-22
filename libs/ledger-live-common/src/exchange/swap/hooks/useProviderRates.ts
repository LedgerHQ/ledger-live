import { useCallback, useEffect, useReducer, useState } from "react";
import { getExchangeRates } from "..";
import { Transaction } from "../../../generated/types";
import {
  Exchange,
  ExchangeRate,
  OnNoRatesCallback,
  SwapSelectorStateType,
  RatesReducerState,
} from "../types";
import { pickExchangeRate } from "../utils";
import { SetExchangeRateCallback } from "./useSwapTransaction";

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
  exchangeRate?: ExchangeRate;
  transaction?: Transaction | null;
  onNoRates?: OnNoRatesCallback;
  setExchangeRate?: SetExchangeRateCallback;
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
          setExchangeRate && setExchangeRate();
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

          /**
           * FIXME
           * need to handle multiple different errors
           * example: one partner proposes the quote but with a "minAmount" and
           * another one does not propose the quote
           */

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
