import {
  CountervaluesBridge,
  CountervaluesProvider,
  useCountervaluesPolling,
} from "@ledgerhq/live-countervalues-react";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import {
  CountervaluesSettings,
  CounterValuesStateRaw,
  RateMapRaw,
} from "@ledgerhq/live-countervalues/types";
import { flow } from "lodash/fp";
import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
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
} from "../reducers/countervalues";

/**
 * Call side effects outside of the primary render tree, avoiding costly child re-renders
 */
function Effect({ userSettings }: { userSettings: CountervaluesSettings }) {
  useCacheManager(userSettings);
  usePollingManager();

  return null;
}

export function CountervaluesManagedProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState: CounterValuesStateRaw;
}) {
  const userSettings = useCalculateCountervaluesUserSettings();
  const dispatch = useDispatch();

  const bridge = useMemo(
    (): CountervaluesBridge => ({
      setPollingIsPolling: flow(
        countervaluesActions.COUNTERVALUES_POLLING_SET_IS_POLLING,
        dispatch,
      ),
      setPollingTriggerLoad: flow(
        countervaluesActions.COUNTERVALUES_POLLING_SET_TRIGGER_LOAD,
        dispatch,
      ),
      setState: flow(countervaluesActions.COUNTERVALUES_STATE_SET, dispatch),
      setStateError: flow(countervaluesActions.COUNTERVALUES_STATE_SET_ERROR, dispatch),
      setStatePending: flow(countervaluesActions.COUNTERVALUES_STATE_SET_PENDING, dispatch),
      usePollingIsPolling: useCountervaluesPollingIsPolling,
      usePollingTriggerLoad: useCountervaluesPollingTriggerLoad,
      useState: useCountervaluesState,
      useStateError: useCountervaluesStateError,
      useStatePending: useCountervaluesStatePending,
      wipe: flow(countervaluesActions.COUNTERVALUES_WIPE, dispatch),
    }),
    [dispatch],
  );

  return (
    <CountervaluesProvider bridge={bridge} savedState={initialState} userSettings={userSettings}>
      <Effect userSettings={userSettings} />
      {children}
    </CountervaluesProvider>
  );
}

function useCacheManager(userSettings: CountervaluesSettings) {
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
  }, [state, userSettings, status]);
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
