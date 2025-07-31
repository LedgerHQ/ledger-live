import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import {
  calculate,
  importCountervalues,
  inferTrackingPairForAccounts,
  loadCountervalues,
  trackingPairForTopCoins,
} from "@ledgerhq/live-countervalues/logic";
import type {
  CounterValuesState,
  CounterValuesStateRaw,
  CountervaluesSettings,
  TrackingPair,
} from "@ledgerhq/live-countervalues/types";
import { useDebounce } from "@ledgerhq/live-hooks/useDebounce";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useMarketcapIds } from "./CountervaluesMarketcapProvider";

export { CountervaluesMarketcapProvider, useMarketcapIds } from "./CountervaluesMarketcapProvider";

export interface PollingState {
  isPolling: boolean;
  triggerRef: number;
}

/**
 * Bridge enabling platform-specific persistence of countervalues state.
 * @note: make sure that the object is memoized to avoid re-renders.
 */
export interface CountervaluesBridge {
  setPollingIsPolling(polling: boolean): void;
  setPollingTriggerLoad(triggerLoad: boolean): void;
  setState(state: CounterValuesState): void;
  setStateError(error: Error): void;
  setStatePending(pending: boolean): void;
  usePollingIsPolling(): boolean;
  usePollingTriggerLoad(): boolean;
  useStateError(): Error | null;
  useStatePending(): boolean;
  useState(): CounterValuesState;
  wipe(): void;
}

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

export type Props = {
  children: React.ReactNode;
  userSettings: CountervaluesSettings;
  bridge: CountervaluesBridge;
  // the time to wait before the first poll when app starts (allow things to render to not do all at boot time)
  pollInitDelay?: number;
  // the minimum time to wait before two automatic polls (then one that happen whatever network/appstate events)
  autopollInterval?: number;
  // debounce time before actually fetching
  debounceDelay?: number;
  savedState?: CounterValuesStateRaw;
};

// TODO: Initial context should be null
const CountervaluesPollingContext = createContext<
  Pick<Polling, "wipe" | "poll" | "start" | "stop">
>({
  wipe: () => {},
  poll: () => {},
  start: () => {},
  stop: () => {},
});

const CountervaluesUserSettingsContext = createContext<CountervaluesSettings>({
  // dummy values that are overriden by the context provider
  trackingPairs: [],
  autofillGaps: true,
  refreshRate: 0,
  marketCapBatchingAfterRank: 0,
});

const CountervaluesContext = createContext<CountervaluesBridge | null>(null);
function useCountervaluesBridgeContext() {
  const bridge = useContext(CountervaluesContext);
  if (!bridge) {
    throw new Error(
      "'useCountervaluesBridgeContext' must be used within a 'CountervaluesProvider'",
    );
  }
  return bridge;
}

function trackingPairsHash(a: TrackingPair[]) {
  return a
    .map(p => `${p.from.ticker}:${p.to.ticker}:${p.startDate.toISOString().slice(0, 10) || ""}`)
    .sort()
    .join("|");
}

/**
 * Root countervalues provider (polling + calculation).
 */
export function CountervaluesProvider({
  children,
  userSettings,
  bridge,
  pollInitDelay = 3 * 1000,
  debounceDelay = 1000,
  savedState,
}: Props): ReactElement {
  const { refreshRate, marketCapBatchingAfterRank } = userSettings;
  const debouncedUserSettings = useDebounce(userSettings, debounceDelay);

  const marketcapIds = useMarketcapIds();

  const batchStrategySolver = useMemo(
    () => ({
      shouldBatchCurrencyFrom: (currency: Currency) => {
        if (currency.type === "FiatCurrency") return false;
        const i = marketcapIds.indexOf(currency.id);
        return i === -1 || i > marketCapBatchingAfterRank;
      },
    }),
    [marketCapBatchingAfterRank, marketcapIds],
  );

  // flag used to trigger a loadCountervalues
  // const [triggerLoad, setTriggerLoad] = useState(false);
  const triggerLoad = bridge.usePollingTriggerLoad();

  // trigger poll only when userSettings changes in a debounced way
  useEffect(() => {
    bridge.setPollingTriggerLoad(true);
  }, [bridge, debouncedUserSettings]);

  // loadCountervalues logic
  const currentState = bridge.useState();
  const pending = bridge.useStatePending();

  // loadCountervalues logic using bridge
  useEffect(() => {
    if (pending || !triggerLoad) return;
    bridge.setPollingTriggerLoad(false);

    bridge.setStatePending(true);
    loadCountervalues(
      currentState,
      userSettings,
      batchStrategySolver,
      userSettings.granularitiesRates,
    ).then(
      s => {
        bridge.setState(s);
        bridge.setStatePending(false);
      },
      e => {
        bridge.setStateError(e);
        bridge.setStatePending(false);
      },
    );
  }, [pending, currentState, userSettings, triggerLoad, batchStrategySolver, bridge]);

  // save the state when it changes
  useEffect(() => {
    if (!savedState?.status || !Object.keys(savedState.status).length) return;
    bridge.setState(importCountervalues(savedState, userSettings));
  }, [bridge, savedState, userSettings]);

  // manage the auto polling loop
  // const [isPolling, setIsPolling] = useState(true);
  const isPolling = bridge.usePollingIsPolling();
  useEffect(() => {
    if (!isPolling) return;
    let pollingTimeout: ReturnType<typeof setTimeout>;
    function pollingLoop() {
      bridge.setPollingTriggerLoad(true);
      pollingTimeout = setTimeout(pollingLoop, refreshRate);
    }
    pollingTimeout = setTimeout(pollingLoop, pollInitDelay);
    return () => clearTimeout(pollingTimeout);
  }, [refreshRate, pollInitDelay, isPolling, bridge]);

  const polling = useMemo<Pick<Polling, "wipe" | "poll" | "start" | "stop">>(
    () => ({
      wipe: () => bridge.wipe(),
      poll: () => bridge.setPollingTriggerLoad(true),
      start: () => bridge.setPollingIsPolling(true),
      stop: () => bridge.setPollingIsPolling(false),
    }),
    [bridge],
  );

  return (
    <CountervaluesPollingContext.Provider value={polling}>
      <CountervaluesUserSettingsContext.Provider value={userSettings}>
        <CountervaluesContext.Provider value={bridge}>{children}</CountervaluesContext.Provider>
      </CountervaluesUserSettingsContext.Provider>
    </CountervaluesPollingContext.Provider>
  );
}

/** Returns the full countervalues state. */
export function useCountervaluesState(): CounterValuesState {
  const bridge = useCountervaluesBridgeContext();
  return bridge.useState();
}

// allows consumer to access the countervalues polling control object
export function useCountervaluesPolling(): Polling {
  const bridge = useCountervaluesBridgeContext();
  const polling = useContext(CountervaluesPollingContext);
  const pending = bridge.useStatePending();
  const error = bridge.useStateError();
  return useMemo(() => ({ ...polling, pending, error }), [error, pending, polling]);
}

// allows consumer to access the user settings that was used to fetch the countervalues
export function useCountervaluesUserSettingsContext(): CountervaluesSettings {
  return useContext(CountervaluesUserSettingsContext);
}

// provides a way to calculate a countervalue from a value
export function useCalculate(query: {
  value: number;
  from: Currency;
  to: Currency;
  disableRounding?: boolean;
  date?: Date | null | undefined;
  reverse?: boolean;
}): number | null | undefined {
  const state = useCountervaluesState();
  return calculate(state, query);
}

// provides a way to calculate a countervalue from a value using a callback
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
  account,
  fiatCurrency,
  cryptoAmount,
}: {
  account: AccountLike;
  fiatCurrency: Currency;
  cryptoAmount: BigNumber;
}): {
  fiatAmount: BigNumber;
  fiatUnit: Unit;
  calculateCryptoAmount: (fiatAmount: BigNumber) => BigNumber;
} {
  const cryptoCurrency = getAccountCurrency(account);
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

// infer the tracking pairs for the top coins that the portfolio needs to display itself
// if startDate is undefined, the feature is disabled
export function useTrackingPairsForTopCoins(
  marketcapIds: string[],
  countervalue: Currency,
  size: number,
  startDate: Date | undefined,
) {
  const dateTimestamp = startDate?.getTime();
  return useMemo(
    () =>
      dateTimestamp
        ? trackingPairForTopCoins(marketcapIds, size, countervalue, new Date(dateTimestamp))
        : [],
    [marketcapIds, countervalue, dateTimestamp, size],
  );
}

export function useTrackingPairForAccounts(
  accounts: Account[],
  countervalue: Currency,
): TrackingPair[] {
  // first we cache the tracking pairs with its hash
  const c = useMemo(() => {
    const pairs = inferTrackingPairForAccounts(accounts, countervalue);
    return { pairs, hash: trackingPairsHash(pairs) };
  }, [accounts, countervalue]);
  // we only want to return the pairs when the hash changes
  // to not recalculate pairs as fast as accounts resynchronizes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => c.pairs, [c.hash]);
}
