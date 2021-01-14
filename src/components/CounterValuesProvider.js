// @flow
import React, { useState, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import {
  Countervalues,
  useCountervaluesPolling,
} from "@ledgerhq/live-common/lib/countervalues/react";
import { useUserSettings } from "../actions/general";

export default function CountervaluesProvider({
  children,
  initialState,
}: {
  children: React$Node,
  initialState: *,
}) {
  const userSettings = useUserSettings();

  return (
    <Countervalues userSettings={userSettings} savedState={initialState}>
      <CountervaluesManager>{children}</CountervaluesManager>
    </Countervalues>
  );
}

function CountervaluesManager({ children }: { children: React$Node }) {
  usePollingManager();

  return children;
}

function usePollingManager() {
  const { start, stop } = useCountervaluesPolling();
  const appState = useRef(AppState.currentState ?? "");
  const { isInternetReachable } = useNetInfo();
  const [isActive, setIsActive] = useState(!!appState.current);

  useEffect(() => {
    function handleChange(nextAppState) {
      setIsActive(
        appState.current.match(/inactive|background/) &&
          nextAppState === "active",
      );

      appState.current = nextAppState;
    }

    AppState.addEventListener("change", handleChange);

    return () => {
      AppState.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (!isInternetReachable || !isActive) {
      stop();
      return;
    }
    start();
  }, [isInternetReachable, isActive, start, stop]);
}
