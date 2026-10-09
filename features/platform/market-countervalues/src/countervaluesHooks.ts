import { calculate, type CounterValuesState } from "@domain/entity-market-countervalues";
import type { CryptoOrTokenCurrency, Currency } from "@domain/entity-currency";
import type { Unit } from "@domain/entity-currency-unit";
import { BigNumber } from "bignumber.js";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  countervaluesStateErrorSelector,
  countervaluesStatePendingSelector,
  countervaluesStateSelector,
  setCountervaluesPollingIsPolling,
  setCountervaluesPollingTriggerLoad,
  wipeCountervalues,
} from "./countervaluesSlice";

// Polling is the control object you get from the high level <PollingConsumer>{ polling => ...
export type Polling = {
  // completely wipe all countervalues
  wipe: () => void;
  // one shot poll function
  // TODO: is there any usecases returning promise here?
  // It's a bit tricky to return Promise with current impl
  poll: () => void;
  // start background polling
  start: () => void;
  // stop background polling
  stop: () => void;
  // true when the polling is in progress
  pending: boolean;
  // if the last polling failed, there will be an error
  error: Error | null | undefined;
};

/** Returns the full countervalues state. */
export function useCountervaluesState(): CounterValuesState {
  return useSelector(countervaluesStateSelector);
}

/** Allows consumer to access the countervalues polling control object */
export function useCountervaluesPolling(): Polling {
  const dispatch = useDispatch();
  const pending = useSelector(countervaluesStatePendingSelector);
  const error = useSelector(countervaluesStateErrorSelector);
  return useMemo(
    () => ({
      poll: () => dispatch(setCountervaluesPollingTriggerLoad(true)),
      start: () => dispatch(setCountervaluesPollingIsPolling(true)),
      stop: () => dispatch(setCountervaluesPollingIsPolling(false)),
      wipe: () => dispatch(wipeCountervalues()),
      pending,
      error,
    }),
    [dispatch, error, pending],
  );
}

/**
 * Provides a way to calculate a countervalue from a value
 * Seems like a major bottleneck, see if it actually needs the full state or we can select only the needed data
 */
export function useCalculate(query: {
  value: number;
  from: Currency;
  to: Currency;
  disableRounding?: boolean;
  date?: Date | null;
  reverse?: boolean;
}): number | null | undefined {
  const state = useCountervaluesState();
  return useMemo(() => calculate(state, query), [state, query]);
}

/** Provides a way to calculate a countervalue from a value using a callback */
export function useCalculateCountervalueCallback({
  to,
}: {
  to: Currency;
}): (from: Currency, value: BigNumber) => BigNumber | null | undefined {
  const state = useCountervaluesState();
  return useCallback(
    (from: Currency, value: BigNumber) => {
      const countervalue = calculate(state, {
        value: value.toNumber(),
        from,
        to,
        disableRounding: true,
      });
      return typeof countervalue === "number" ? new BigNumber(countervalue) : countervalue;
    },
    [to, state],
  );
}

/** Helper for send-flow: returns fiat amount and reverse calculation. */
export function useSendAmount({
  cryptoCurrency,
  fiatCurrency,
  cryptoAmount,
}: {
  cryptoCurrency: CryptoOrTokenCurrency;
  fiatCurrency: Currency;
  cryptoAmount: BigNumber;
}): {
  fiatAmount: BigNumber;
  fiatUnit: Unit;
  calculateCryptoAmount: (fiatAmount: BigNumber) => BigNumber;
} {
  const fiatCountervalue = useCalculate({
    from: cryptoCurrency,
    to: fiatCurrency,
    value: cryptoAmount.toNumber(),
    disableRounding: true,
  });
  const fiatAmount = new BigNumber(fiatCountervalue ?? 0);
  const fiatUnit = fiatCurrency.units[0];
  const state = useCountervaluesState();
  const calculateCryptoAmount = useCallback(
    (fiatAmount: BigNumber) =>
      new BigNumber(
        calculate(state, {
          from: cryptoCurrency,
          to: fiatCurrency,
          value: fiatAmount.toNumber(),
          reverse: true,
        }) ?? 0,
      ),
    [state, cryptoCurrency, fiatCurrency],
  );
  return { fiatAmount, fiatUnit, calculateCryptoAmount };
}
