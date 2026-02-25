import { CountervaluesMarketcapProvider } from "@ledgerhq/live-countervalues-react";
import React, { useMemo } from "react";
import { useDispatch } from "~/context/hooks";
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
      useIds: useCountervaluesMarketcapIds,
      useLastUpdated: useCountervaluesMarketcapLastUpdated,
      setLoading: (loading: boolean) => dispatch(setCountervaluesMarketcapLoading(loading)),
      setIds: (next: string[]) => dispatch(setCountervaluesMarketcapIds(next)),
      setError: (msg: string) => dispatch(setCountervaluesMarketcapError(msg)),
    }),
    [dispatch],
  );

  return (
    <CountervaluesMarketcapProvider bridge={bridge}>{children}</CountervaluesMarketcapProvider>
  );
}
