import { CountervaluesMarketcapProvider } from "@ledgerhq/live-countervalues-react";
import { flow } from "lodash/fp";
import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { countervaluesActions } from "../actions/countervalues";
import {
  useCountervaluesMarketcapIds,
  useCountervaluesMarketcapLastUpdated,
} from "../reducers/countervalues";

export function CountervaluesMarketcapBridgedProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  const bridge = useMemo(
    () => ({
      setError: flow(countervaluesActions.COUNTERVALUES_MARKETCAP_SET_ERROR, dispatch),
      setIds: flow(countervaluesActions.COUNTERVALUES_MARKETCAP_SET_IDS, dispatch),
      setLoading: flow(countervaluesActions.COUNTERVALUES_MARKETCAP_SET_LOADING, dispatch),
      useIds: useCountervaluesMarketcapIds,
      useLastUpdated: useCountervaluesMarketcapLastUpdated,
    }),
    [dispatch],
  );

  return (
    <CountervaluesMarketcapProvider bridge={bridge}>{children}</CountervaluesMarketcapProvider>
  );
}
