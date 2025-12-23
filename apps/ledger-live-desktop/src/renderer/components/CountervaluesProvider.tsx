import {
  CountervaluesBridge,
  CountervaluesProvider,
  useCountervaluesPolling,
} from "@ledgerhq/live-countervalues-react";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { CounterValuesStateRaw, RateMapRaw } from "@ledgerhq/live-countervalues/types";
import React, { useEffect, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { bindActionCreators } from "redux";
import { setKey } from "~/renderer/storage";
import { countervaluesActions } from "../actions/countervalues";
import { useCalculateCountervaluesUserSettings } from "../actions/general";
import {
  useCountervaluesPollingIsPolling,
  useCountervaluesPollingTriggerLoad,
  useCountervaluesState,
  useCountervaluesStateError,
  useCountervaluesStateExport,
  useCountervaluesStatePending,
  useCountervaluesUserSettings,
} from "../reducers/countervalues";

export function useCountervaluesBridge() {
  const dispatch = useDispatch();
  return useMemo(
    (): CountervaluesBridge => ({
      ...bindActionCreators(
        {
          setPollingIsPolling: countervaluesActions.COUNTERVALUES_POLLING_SET_IS_POLLING,
          setPollingTriggerLoad: countervaluesActions.COUNTERVALUES_POLLING_SET_TRIGGER_LOAD,
          setState: countervaluesActions.COUNTERVALUES_STATE_SET,
          setStateError: countervaluesActions.COUNTERVALUES_STATE_SET_ERROR,
          setStatePending: countervaluesActions.COUNTERVALUES_STATE_SET_PENDING,
          wipe: countervaluesActions.COUNTERVALUES_WIPE,
        },
        dispatch,
      ),
      usePollingIsPolling: useCountervaluesPollingIsPolling,
      usePollingTriggerLoad: useCountervaluesPollingTriggerLoad,
      useState: useCountervaluesState,
      useStateError: useCountervaluesStateError,
      useStatePending: useCountervaluesStatePending,
      useUserSettings: useCountervaluesUserSettings,
    }),
    [dispatch],
  );
}

/**
 * Call side effects outside of the primary render tree, avoiding costly child re-renders
 */
function Effect() {
  useCalculateCountervaluesUserSettings();
  useCacheManager();
  usePollingManager();

  return null;
}

export function CountervaluesBridgedProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState: CounterValuesStateRaw;
}) {
  const bridge = useCountervaluesBridge();

  return (
    <CountervaluesProvider bridge={bridge} savedState={initialState}>
      <Effect />
      {children}
    </CountervaluesProvider>
  );
}

function useCacheManager() {
  const userSettings = useCountervaluesUserSettings();
  const { status, ...state } = useCountervaluesStateExport();

  useEffect(() => {
    if (!Object.keys(status).length) return;
    const ids = userSettings.trackingPairs.map(pairId);
    const newState = Object.entries(state).reduce(
      (prev: Record<string, RateMapRaw>, [key, val]) =>
        ids.includes(key)
          ? {
              ...prev,
              [key]: val,
            }
          : prev,
      {},
    );
    setKey("app", "countervalues", {
      ...newState,
      status: status,
    });
  }, [state, status, userSettings]);
}

function usePollingManager() {
  const { start, stop } = useCountervaluesPolling();
  useEffect(() => {
    window.addEventListener("blur", stop);
    window.addEventListener("focus", start);
    return () => {
      window.removeEventListener("blur", stop);
      window.removeEventListener("focus", start);
    };
  }, [start, stop]);
}
