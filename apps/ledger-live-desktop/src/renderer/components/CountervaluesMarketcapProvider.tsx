import { CountervaluesMarketcapProvider } from "@ledgerhq/live-countervalues-react";
import { flow } from "lodash/fp";
import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { countervaluesActions } from "../actions/countervalues";
import {
  useCountervaluesMarketcapIds,
  useCountervaluesMarketcapLastUpdated,
} from "../reducers/countervalues";

function useCountervaluesMarketcapBridge() {
  const dispatch = useDispatch();
  return useMemo(
    () => ({
      setError: flow(countervaluesActions.COUNTERVALUES_MARKETCAP_SET_ERROR, dispatch),
      setIds: flow(countervaluesActions.COUNTERVALUES_MARKETCAP_SET_IDS, dispatch),
      setLoading: flow(countervaluesActions.COUNTERVALUES_MARKETCAP_SET_LOADING, dispatch),
      useIds: useCountervaluesMarketcapIds,
      useLastUpdated: useCountervaluesMarketcapLastUpdated,
    }),
    [dispatch],
  );
}

export function CountervaluesMarketcapBridgedProvider({ children }: { children: React.ReactNode }) {
  const bridge = useCountervaluesMarketcapBridge();

  return (
    <CountervaluesMarketcapProvider bridge={bridge}>{children}</CountervaluesMarketcapProvider>
  );
}
