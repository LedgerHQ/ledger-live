// @flow
import { BigNumber } from "bignumber.js";
import React, {
  createContext,
  useRef,
  useMemo,
  useContext,
  useEffect,
  useReducer,
  useState,
  useCallback,
} from "react";
import type {
  Account,
  AccountLike,
  PortfolioRange,
  Currency,
  CryptoCurrency,
  TokenCurrency,
} from "../types";
import {
  getBalanceHistoryWithCountervalue,
  getPortfolio,
  getCurrencyPortfolio,
  getAssetsDistribution,
} from "../portfolio";
import {
  getAccountCurrency,
  flattenAccounts,
  getAccountUnit,
} from "../account";
import {
  initialState,
  calculate,
  calculateMany,
  loadCountervalues,
  exportCountervalues,
  importCountervalues,
  inferTrackingPairForAccounts,
} from "./logic";
import type {
  CounterValuesState,
  CounterValuesStateRaw,
  CountervaluesSettings,
  TrackingPair,
} from "./types";
import { useDebounce } from "../hooks/useDebounce";

// Polling is the control object you get from the high level <PollingConsumer>{ polling => ...
export type Polling = {
  // completely wipe all countervalues
  wipe: () => void,
  // one shot poll function
  // TODO: is there any usecases returning promise here?
  // It's a bit tricky to return Promise with current impl
  poll: () => void,
  // start background polling
  start: () => void,
  // stop background polling
  stop: () => void,
  // true when the polling is in progress
  pending: boolean,
  // if the last polling failed, there will be an error
  error: ?Error,
};

export type Props = {
  children: React$Node,
  userSettings: CountervaluesSettings,
  // the time to wait before the first poll when app starts (allow things to render to not do all at boot time)
  pollInitDelay?: number,
  // the minimum time to wait before two automatic polls (then one that happen whatever network/appstate events)
  autopollInterval?: number,
  // debounce time before actually fetching
  debounceDelay?: number,
  savedState?: CounterValuesStateRaw,
};

const CountervaluesPollingContext = createContext<Polling>({
  wipe: () => {},
  poll: () => {},
  start: () => {},
  stop: () => {},
  pending: false,
  error: null,
});

const CountervaluesContext = createContext<CounterValuesState>(initialState);

function trackingPairsHash(a: TrackingPair[]) {
  return a
    .map(
      (p) =>
        `${p.from.ticker}:${p.to.ticker}:${
          p.startDate?.toISOString().slice(0, 10) || ""
        }`
    )
    .sort()
    .join("|");
}

export function useTrackingPairForAccounts(
  accounts: Account[],
  countervalue: Currency
): TrackingPair[] {
  const memo = useMemo(
    () => inferTrackingPairForAccounts(accounts, countervalue),
    [accounts, countervalue]
  );
  const ref = useRef(memo);
  if (trackingPairsHash(ref.current) === trackingPairsHash(memo)) {
    return ref.current;
  }
  ref.current = memo;
  return memo;
}

export function Countervalues({
  children,
  userSettings,
  pollInitDelay = 1 * 1000,
  autopollInterval = 120 * 1000,
  debounceDelay = 1000,
  savedState,
}: Props) {
  const debouncedUserSettings = useDebounce(userSettings, debounceDelay);

  const [{ state, pending, error }, dispatch] = useReducer<FetchState, Action>(
    fetchReducer,
    initialFetchState
  );

  // flag used to trigger a loadCountervalues
  const [triggerLoad, setTriggerLoad] = useState(false);

  // trigger poll only when userSettings changes. in a debounced way.
  useEffect(() => {
    setTriggerLoad(true);
  }, [debouncedUserSettings]);

  // loadCountervalues logic
  useEffect(() => {
    if (pending || !triggerLoad) return;
    setTriggerLoad(false);
    dispatch({ type: "pending" });
    loadCountervalues(state, userSettings).then(
      (state) => {
        dispatch({ type: "success", payload: state });
      },
      (error) => {
        dispatch({ type: "error", payload: error });
      }
    );
  }, [pending, state, userSettings, triggerLoad]);

  // save the state when it changes
  useEffect(() => {
    if (!savedState?.status || !Object.keys(savedState.status).length) return;
    dispatch({
      type: "setCounterValueState",
      payload: importCountervalues(savedState, userSettings),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedState]);

  // manage the auto polling loop and the interface for user land to trigger a reload
  const [isPolling, setIsPolling] = useState(true);
  useEffect(() => {
    if (!isPolling) return;
    let pollingTimeout;
    function pollingLoop() {
      setTriggerLoad(true);
      pollingTimeout = setTimeout(pollingLoop, autopollInterval);
    }
    pollingTimeout = setTimeout(pollingLoop, pollInitDelay);
    return () => clearTimeout(pollingTimeout);
  }, [autopollInterval, pollInitDelay, isPolling]);

  const polling = useMemo<Polling>(
    () => ({
      wipe: () => {
        dispatch({ type: "wipe" });
      },
      poll: () => setTriggerLoad(true),
      start: () => setIsPolling(true),
      stop: () => setIsPolling(false),
      pending,
      error,
    }),
    [pending, error]
  );

  return (
    <CountervaluesPollingContext.Provider value={polling}>
      <CountervaluesContext.Provider value={state}>
        {children}
      </CountervaluesContext.Provider>
    </CountervaluesPollingContext.Provider>
  );
}

type Action =
  | {
      type: "success",
      payload: CounterValuesState,
    }
  | {
      type: "error",
      payload: Error,
    }
  | {
      type: "pending",
    }
  | {
      type: "wipe",
    }
  | {
      type: "setCounterValueState",
      payload: CounterValuesState,
    };

type FetchState = {
  state: CounterValuesState,
  pending: boolean,
  error?: Error,
};

const initialFetchState: FetchState = { state: initialState, pending: false };

function fetchReducer(state, action) {
  switch (action.type) {
    case "success":
      return { state: action.payload, pending: false, error: undefined };
    case "error":
      return { ...state, pending: false, error: action.payload };
    case "pending":
      return { ...state, pending: true, error: undefined };
    case "wipe":
      return { state: initialState, pending: false, error: undefined };
    case "setCounterValueState":
      return { ...state, state: action.payload };
    default:
      return state;
  }
}

export function useCountervaluesPolling(): Polling {
  return useContext(CountervaluesPollingContext);
}

export function useCountervaluesState(): CounterValuesState {
  return useContext(CountervaluesContext);
}

export function useCountervaluesExport(): CounterValuesStateRaw {
  const state = useContext(CountervaluesContext);
  return useMemo(() => exportCountervalues(state), [state]);
}

export function useCalculate(query: {
  value: number,
  from: Currency,
  to: Currency,
  disableRounding?: boolean,
  date?: ?Date,
  reverse?: boolean,
}): ?number {
  const state = useCountervaluesState();
  return calculate(state, query);
}

export function useCalculateMany(
  dataPoints: Array<{ value: number, date: ?Date }>,
  query: {
    from: Currency,
    to: Currency,
    disableRounding?: boolean,
    reverse?: boolean,
  }
): Array<?number> {
  const state = useCountervaluesState();
  // TODO how to approach perf for this? hash function of the datapoints? responsability on user land?
  return calculateMany(state, dataPoints, query);
}

// TODO perf of the useCalculate*, does it even worth worrying?

// TODO move to portfolio module (I couldn't make useCountervaluesState to work there)
export function useBalanceHistoryWithCountervalue({
  account,
  range,
  to,
}: {
  account: AccountLike,
  range: PortfolioRange,
  to: Currency,
}) {
  const from = getAccountCurrency(account);
  const state = useCountervaluesState();

  return useMemo(
    () =>
      getBalanceHistoryWithCountervalue(account, range, (_, value, date) => {
        const countervalue = calculate(state, {
          value: value.toNumber(),
          from,
          to,
          disableRounding: true,
          date,
        });

        return typeof countervalue === "number"
          ? BigNumber(countervalue)
          : countervalue;
      }),
    [account, from, to, range, state]
  );
}

export function usePortfolio({
  accounts,
  range,
  to,
}: {
  accounts: Account[],
  range: PortfolioRange,
  to: Currency,
}) {
  const state = useCountervaluesState();

  return useMemo(
    () =>
      getPortfolio(accounts, range, (from, value, date) => {
        const countervalue = calculate(state, {
          value: value.toNumber(),
          from,
          to,
          disableRounding: true,
          date,
        });

        return typeof countervalue === "number"
          ? BigNumber(countervalue)
          : countervalue;
      }),
    [accounts, range, state, to]
  );
}

export function useCurrencyPortfolio({
  accounts: rawAccounts,
  range,
  to,
  currency,
}: {
  accounts: Account[],
  range: PortfolioRange,
  to: Currency,
  currency: CryptoCurrency | TokenCurrency,
}) {
  const accounts = flattenAccounts(rawAccounts).filter(
    (a) => getAccountCurrency(a) === currency
  );
  const state = useCountervaluesState();

  return useMemo(
    () =>
      getCurrencyPortfolio(accounts, range, (from, value, date) => {
        const countervalue = calculate(state, {
          value: value.toNumber(),
          from,
          to,
          disableRounding: true,
          date,
        });

        return typeof countervalue === "number"
          ? BigNumber(countervalue)
          : countervalue;
      }),
    [accounts, range, state, to]
  );
}

export function useDistribution({
  accounts,
  to,
}: {
  accounts: Account[],
  to: Currency,
}) {
  const calc = useCalculateCountervalueCallback({ to });

  return useMemo(() => {
    return getAssetsDistribution(accounts, calc, {
      minShowFirst: 6,
      maxShowFirst: 6,
      showFirstThreshold: 0.95,
    });
  }, [accounts, calc]);
}

export function useCalculateCountervalueCallback({ to }: { to: Currency }) {
  const state = useCountervaluesState();

  return useCallback(
    (from: Currency, value: BigNumber): ?BigNumber => {
      const countervalue = calculate(state, {
        value: value.toNumber(),
        from,
        to,
        disableRounding: true,
      });
      return typeof countervalue === "number"
        ? BigNumber(countervalue)
        : countervalue;
    },
    [to, state]
  );
}

export function useSendAmount({
  account,
  fiatCurrency,
  cryptoAmount,
}: {
  account: AccountLike,
  fiatCurrency: Currency,
  cryptoAmount: BigNumber,
}) {
  const cryptoCurrency = getAccountCurrency(account);
  const fiatCountervalue = useCalculate({
    from: cryptoCurrency,
    to: fiatCurrency,
    value: cryptoAmount.toNumber(),
    disableRounding: true,
  });
  const fiatAmount = BigNumber(fiatCountervalue ?? 0);
  const fiatUnit = fiatCurrency.units[0];
  const cryptoUnit = getAccountUnit(account);
  const state = useCountervaluesState();
  const calculateCryptoAmount = useCallback(
    (fiatAmount: BigNumber) => {
      const cryptoAmount = BigNumber(
        calculate(state, {
          from: cryptoCurrency,
          to: fiatCurrency,
          value: fiatAmount.toNumber(),
          reverse: true,
        }) ?? 0
      );
      return cryptoAmount;
    },
    [state, cryptoCurrency, fiatCurrency]
  );

  return {
    cryptoUnit,
    fiatAmount,
    fiatUnit,
    calculateCryptoAmount,
  };
}
