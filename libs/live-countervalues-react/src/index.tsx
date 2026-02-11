import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import {
  calculate,
  importCountervalues,
  inferTrackingPairForAccounts,
  loadCountervalues,
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

export { useMarketcapIds } from "./CountervaluesMarketcapProvider";

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
  useUserSettings(): CountervaluesSettings;
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
  /** Bridge enabling platform-specific persistence of countervalues state. */
  bridge: CountervaluesBridge;
  children: React.ReactNode;
  /** the time to wait before the first poll when app starts (allow things to render to not do all at boot time) */
  pollInitDelay?: number;
  /** the minimum time to wait before two automatic polls (then one that happen whatever network/appstate events) */
  autopollInterval?: number;
  /** debounce time before actually fetching */
  debounceDelay?: number;
  savedState?: CounterValuesStateRaw;
};

/**
 * Base Countervalues Context to use without polling logic.
 */
export const CountervaluesContext = createContext<CountervaluesBridge | null>(null);

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
 * Call side effects outside of the primary render tree, avoiding costly child re-renders
 */
function Effect({
  bridge,
  savedState,
  debounceDelay = 1000,
  pollInitDelay = 3 * 1000,
}: Pick<Props, "autopollInterval" | "bridge" | "debounceDelay" | "pollInitDelay" | "savedState">) {
  const userSettings = bridge.useUserSettings();
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

  // restore state from persisted raw (history only so we know it's first run and check holes)
  useEffect(() => {
    if (!savedState || typeof savedState !== "object") return;
    if (!Object.keys(savedState).length) return;
    bridge.setState(importCountervalues(savedState, userSettings));
  }, [bridge, savedState, userSettings]);

  // manage the auto polling loop
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

  return null;
}

/**
 * Root countervalues provider (polling + calculation).
 */
export function CountervaluesProvider({ children, bridge, ...rest }: Props): ReactElement {
  return (
    <CountervaluesContext.Provider value={bridge}>
      <Effect {...rest} bridge={bridge} />
      {children}
    </CountervaluesContext.Provider>
  );
}

/** Returns the full countervalues state. */
export function useCountervaluesState(): CounterValuesState {
  return useCountervaluesBridgeContext().useState();
}

/** Allows consumer to access the countervalues polling control object */
export function useCountervaluesPolling(): Polling {
  const bridge = useCountervaluesBridgeContext();
  const pending = bridge.useStatePending();
  const error = bridge.useStateError();
  return useMemo(
    () => ({
      poll: () => bridge.setPollingTriggerLoad(true),
      start: () => bridge.setPollingIsPolling(true),
      stop: () => bridge.setPollingIsPolling(false),
      wipe: () => bridge.wipe(),
      pending,
      error,
    }),
    [bridge, error, pending],
  );
}

/** Allows consumer to access the user settings that was used to fetch the countervalues */
export function useCountervaluesUserSettings(): CountervaluesSettings {
  return useCountervaluesBridgeContext().useUserSettings();
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
  date?: Date | null | undefined;
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
