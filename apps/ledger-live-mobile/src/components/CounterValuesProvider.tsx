import React, { useState, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Countervalues, useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { useUserSettings } from "~/actions/general";

export default function CountervaluesProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: CounterValuesStateRaw;
}) {
  const userSettings = useUserSettings();
  return (
    <Countervalues userSettings={userSettings} savedState={initialState}>
      <CountervaluesManager>{children}</CountervaluesManager>
    </Countervalues>
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
