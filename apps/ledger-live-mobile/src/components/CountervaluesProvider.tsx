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
  setCountervaluesError,
  setCountervaluesPending,
  setCountervaluesState,
  wipeCountervalues,
} from "../actions/countervalues";
import { useCountervaluesError, useCountervaluesState } from "../reducers/countervalues";

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
      setError: flow(setCountervaluesError, dispatch),
      setPending: flow(setCountervaluesPending, dispatch),
      setState: flow(setCountervaluesState, dispatch),
      useState: useCountervaluesState,
      useError: useCountervaluesError,
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
