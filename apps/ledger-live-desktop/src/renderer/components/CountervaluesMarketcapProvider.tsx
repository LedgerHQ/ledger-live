import { CountervaluesMarketcapProvider } from "@ledgerhq/live-countervalues-react";
import { flow } from "lodash/fp";
import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  setCountervaluesMarketcapError,
  setCountervaluesMarketcapIds,
  setCountervaluesMarketcapLoading,
} from "../actions/countervalues";
import {
  useCountervaluesMarketcapIds,
  useCountervaluesMarketcapLastUpdated,
} from "../reducers/countervalues";

export function CountervaluesMarketcapBridgedProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  const bridge = useMemo(
    () => ({
      setError: flow(setCountervaluesMarketcapError, dispatch),
      setIds: flow(setCountervaluesMarketcapIds, dispatch),
      setLoading: flow(setCountervaluesMarketcapLoading, dispatch),
      useIds: useCountervaluesMarketcapIds,
      useLastUpdated: useCountervaluesMarketcapLastUpdated,
    }),
    [dispatch],
  );

  return (
    <CountervaluesMarketcapProvider bridge={bridge}>{children}</CountervaluesMarketcapProvider>
  );
}
