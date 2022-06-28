import { useCallback, useEffect, useReducer, useState } from "react";
import { getExchangeRates } from "..";
import { Transaction } from "../../../generated/types";
import type { CustomMinOrMaxError, Exchange, ExchangeRate } from "../types";
import {
  OnNoRatesCallback,
  SetExchangeRateCallback,
  SwapSelectorStateType,
} from "./useSwapTransaction";

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
  transaction,
  onNoRates,
  setExchangeRate,
}: {
  fromState: SwapSelectorStateType;
  toState: SwapSelectorStateType;
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
          let rateError: Error | CustomMinOrMaxError | null | undefined = null;
          rates = rates.reduce<ExchangeRate[]>((acc, rate) => {
            rateError = rateError ?? rate.error;

            /**
             * If we have an error linked to the ammount, this error takes
             * precedence over the other (like a "CurrencyNotSupportedError" one
             * for example)
             */
            if (
              rateError?.name !== rate.error?.name &&
              (rate.error?.name === "SwapExchangeRateAmountTooLow" ||
                rate.error?.name === "SwapExchangeRateAmountTooHigh")
            ) {
              rateError = rate.error;
            }

            if (
              rateError?.name === rate.error?.name &&
              (rate.error?.name === "SwapExchangeRateAmountTooLow" ||
                rate.error?.name === "SwapExchangeRateAmountTooHigh")
            ) {
              /**
               * Comparison pivot, depending on the order in which we want to sort errors
               * If the order is ascending, the pivot is -1, otherwise it's 1
               * Based on returns from https://mikemcl.github.io/bignumber.js/#cmp
               */
              const cmp =
                rateError?.name === "SwapExchangeRateAmountTooLow" ? -1 : 1;

              /**
               * If the amount is too low, the user should put at least the
               * minimum amount possible
               * If the amount is too high, the user should put at most the
               * maximum amount possible
               */

              rateError =
                (rateError as CustomMinOrMaxError).amount.comparedTo(
                  (rate.error as CustomMinOrMaxError)?.amount
                ) === cmp
                  ? rateError
                  : rate.error;
            }

            return rate.error ? acc : [...acc, rate];
          }, []);

          if (rates.length === 0 && rateError) {
            // If all the rates are in error
            dispatchRates({ type: "error", payload: rateError });
          } else {
            dispatchRates({ type: "set", payload: rates });

            /**
             * Select the first rate returned by the API. Should be the prefered
             * rate for the user. Rate ordering logic is handeled on backend side
             */
            const rate = rates?.length > 0 ? rates[0] : null;

            setExchangeRate && setExchangeRate(rate);
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
