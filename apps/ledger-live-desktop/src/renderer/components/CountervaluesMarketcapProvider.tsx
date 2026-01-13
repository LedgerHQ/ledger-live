import { CountervaluesMarketcapProvider } from "@ledgerhq/live-countervalues-react";
import React, { useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { bindActionCreators } from "redux";
import { countervaluesActions } from "../actions/countervalues";
import {
  useCountervaluesMarketcapIds,
  useCountervaluesMarketcapLastUpdated,
} from "../reducers/countervalues";

export function useCountervaluesMarketcapBridge() {
  const dispatch = useDispatch();
  return useMemo(
    () => ({
      ...bindActionCreators(
        {
          setError: countervaluesActions.COUNTERVALUES_MARKETCAP_SET_ERROR,
          setIds: countervaluesActions.COUNTERVALUES_MARKETCAP_SET_IDS,
          setLoading: countervaluesActions.COUNTERVALUES_MARKETCAP_SET_LOADING,
        },
        dispatch,
      ),
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
