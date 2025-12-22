import {
  CountervaluesBridge,
  CountervaluesProvider,
  useCountervaluesPolling,
} from "@ledgerhq/live-countervalues-react";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { flow } from "lodash/fp";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useDispatch } from "~/context/store";
import { useUserSettings } from "~/actions/general";
import {
  setCountervaluesPollingIsPolling,
  setCountervaluesPollingTriggerLoad,
  setCountervaluesState,
  setCountervaluesStateError,
  setCountervaluesStatePending,
  wipeCountervalues,
} from "../actions/countervalues";
import {
  useCountervaluesStateError,
  useCountervaluesStatePending,
  useCountervaluesState,
  useCountervaluesPollingIsPolling,
  useCountervaluesPollingTriggerLoad,
} from "../reducers/countervalues";

/**
 * Call side effects outside of the primary render tree, avoiding costly child re-renders
 */
function Effect() {
  usePollingManager();
  return null;
}

export function useCountervaluesBridge() {
  const userSettings = useUserSettings();
  const dispatch = useDispatch();

  return useMemo(
    (): CountervaluesBridge => ({
      setPollingIsPolling: flow(setCountervaluesPollingIsPolling, dispatch),
      setPollingTriggerLoad: flow(setCountervaluesPollingTriggerLoad, dispatch),
      setState: flow(setCountervaluesState, dispatch),
      setStateError: flow(setCountervaluesStateError, dispatch),
      setStatePending: flow(setCountervaluesStatePending, dispatch),
      usePollingIsPolling: useCountervaluesPollingIsPolling,
      usePollingTriggerLoad: useCountervaluesPollingTriggerLoad,
      useState: useCountervaluesState,
      useStateError: useCountervaluesStateError,
      useStatePending: useCountervaluesStatePending,
      useUserSettings: () => userSettings,
      wipe: flow(wipeCountervalues, dispatch),
    }),
    [dispatch, userSettings],
  );
}

export function CountervaluesBridgedProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: CounterValuesStateRaw;
}) {
  const bridge = useCountervaluesBridge();

  return (
    <CountervaluesProvider bridge={bridge} savedState={initialState}>
      <Effect />
      {children}
    </CountervaluesProvider>
  );
}

function usePollingManager() {
  const { start, stop } = useCountervaluesPolling();
  const appState = useRef(AppState.currentState ?? "");
  const [isActive, setIsActive] = useState<boolean>(!!appState.current);
  useEffect(() => {
    function handleChange(nextAppState: AppStateStatus) {
      setIsActive(
        (appState.current.match(/inactive|background/) && nextAppState === "active") || false,
      );
      appState.current = nextAppState;
    }

    const sub = AppState.addEventListener("change", handleChange);
    return () => {
      sub.remove();
    };
  }, []);
  useEffect(() => {
    if (!isActive) {
      stop();
      return;
    }

    start();
  }, [isActive, start, stop]);
}
