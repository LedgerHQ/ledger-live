import {
  CountervaluesBridge,
  CountervaluesProvider,
  useCountervaluesPolling,
} from "@ledgerhq/live-countervalues-react";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { flow } from "lodash/fp";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useDispatch } from "react-redux";
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

export function CountervaluesManagedProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: CounterValuesStateRaw;
}) {
  const userSettings = useUserSettings();

  const dispatch = useDispatch();

  const bridge = useMemo(
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
      wipe: flow(wipeCountervalues, dispatch),
    }),
    [dispatch],
  );

  return (
    <CountervaluesProvider bridge={bridge} savedState={initialState} userSettings={userSettings}>
      <CountervaluesManager>{children}</CountervaluesManager>
    </CountervaluesProvider>
  );
}

function CountervaluesManager({ children }: { children: React.ReactNode }) {
  usePollingManager();
  return <>{children}</>;
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
