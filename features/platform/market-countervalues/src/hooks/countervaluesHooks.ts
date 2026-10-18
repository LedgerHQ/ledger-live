import {
  calculate,
  wipeCountervalues,
  type CounterValuesCacheView,
  type CounterValuesState,
} from "@domain/entity-market-countervalues";
import type { CryptoOrTokenCurrency, Currency } from "@domain/entity-currency";
import type { Unit } from "@domain/entity-currency-unit";
import { BigNumber } from "bignumber.js";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  countervaluesCacheSelector,
  countervaluesStateSelector,
  countervaluesSyncErrorSelector,
  countervaluesSyncPendingSelector,
} from "../state/reducer";
import { countervaluesLoadRequested, countervaluesPollingSet } from "../state/slice";

// Polling is the control object you get from the high level <PollingConsumer>{ polling => ...
export type Polling = {
  // completely wipe all countervalues
  wipe: () => void;
  // one shot poll function
  poll: () => void;
  // start background polling
  start: () => void;
  // stop background polling
  stop: () => void;
};

/** Where the loop stands, from {@link useCountervaluesLoadStatus}. */
export type CountervaluesLoadStatus = {
  // true while a load is in flight
  pending: boolean;
  // the last load's error, cleared when the next load starts
  error: Error | null;
};

/** Returns the full countervalues state. */
export function useCountervaluesState(): CounterValuesState {
  return useSelector(countervaluesStateSelector);
}

/**
 * Returns what conversions read: a new object only when the rates' cache changes, so a load that
 * only changes the fetch status does not re-render its caller.
 */
export function useCountervaluesCache(): CounterValuesCacheView {
  const cache = useSelector(countervaluesCacheSelector);
  return useMemo(() => ({ cache }), [cache]);
}

/** The countervalues polling controls. Stable, and selects nothing: it never re-renders its caller. */
export function useCountervaluesPolling(): Polling {
  const dispatch = useDispatch();
  return useMemo(
    () => ({
      poll: () => dispatch(countervaluesLoadRequested()),
      start: () => dispatch(countervaluesPollingSet(true)),
      stop: () => dispatch(countervaluesPollingSet(false)),
      wipe: () => dispatch(wipeCountervalues()),
    }),
    [dispatch],
  );
}

/** Whether a load is in flight and the last load's error. Re-renders only when either changes. */
export function useCountervaluesLoadStatus(): CountervaluesLoadStatus {
  const pending = useSelector(countervaluesSyncPendingSelector);
  const error = useSelector(countervaluesSyncErrorSelector);
  return useMemo(() => ({ pending, error }), [pending, error]);
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
  const state = useCountervaluesCache();
  return useMemo(() => calculate(state, query), [state, query]);
}

/** Provides a way to calculate a countervalue from a value using a callback */
export function useCalculateCountervalueCallback({
  to,
}: {
  to: Currency;
}): (from: Currency, value: BigNumber) => BigNumber | null | undefined {
  const state = useCountervaluesCache();
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
  const state = useCountervaluesCache();
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
