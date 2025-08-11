import api from "@ledgerhq/live-countervalues/api/index";
import { log } from "@ledgerhq/logs";
import React, { ReactElement, createContext, useContext, useEffect, useReducer } from "react";

const MARKETCAP_REFRESH = 30 * 60000;
const MARKETCAP_REFRESH_ON_ERROR = 60000;

/**
 * Bridge enabling platform-specific persistence of market-cap ids.
 * NOTE: memoize the object to avoid re-renders.
 */
export interface CountervaluesMarketcapBridge {
  setError(message: string): void;
  setIds(ids: string[]): void;
  setLoading(loading: boolean): void;
  useIds(): string[];
  useLastUpdated(): number | undefined;
}

const CountervaluesMarketcapBridgeContext = createContext<CountervaluesMarketcapBridge | null>(
  null,
);

function useCountervaluesMarketcapBridgeContext() {
  const bridge = useContext(CountervaluesMarketcapBridgeContext);
  if (!bridge) {
    throw new Error(
      "'useCountervaluesMarketcapBridgeContext' must be used within a 'CountervaluesMarketcapProvider'",
    );
  }
  return bridge;
}

/**
 * Call side effects outside of the primary render tree, avoiding costly child re-renders
 * TODO this could be re-written as a side effect only, to avoid dependency on render state.
 */
function Effect({ bridge }: { bridge: CountervaluesMarketcapBridge }) {
  const lastUpdated = bridge.useLastUpdated();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const now = Date.now();

    if (!lastUpdated || now - lastUpdated > MARKETCAP_REFRESH) {
      bridge.setLoading(true);
      api.fetchIdsSortedByMarketcap().then(
        fetchedIds => {
          bridge.setIds(fetchedIds);
          timeout = setTimeout(() => forceUpdate(), MARKETCAP_REFRESH);
        },
        error => {
          log("countervalues", "error fetching marketcap ids " + error);
          bridge.setError(error.message);
          timeout = setTimeout(() => forceUpdate(), MARKETCAP_REFRESH_ON_ERROR);
        },
      );
    } else {
      timeout = setTimeout(() => forceUpdate(), MARKETCAP_REFRESH - (now - lastUpdated));
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [lastUpdated, bridge]);

  return null;
}

/**
 * Provides market-cap ids via the supplied bridge.
 */
export function CountervaluesMarketcapProvider({
  children,
  bridge,
}: {
  children: React.ReactNode;
  /** @param bridge Contains the functions that interact with the apps' state. Reference needs to be stable */
  bridge: CountervaluesMarketcapBridge;
}): ReactElement {
  return (
    <CountervaluesMarketcapBridgeContext.Provider value={bridge}>
      <Effect bridge={bridge} />
      {children}
    </CountervaluesMarketcapBridgeContext.Provider>
  );
}

/** Returns market-cap ids. */
export function useMarketcapIds(): string[] {
  const bridge = useCountervaluesMarketcapBridgeContext();
  return bridge.useIds();
}
