import { CountervaluesProvider } from "@ledgerhq/live-countervalues-react";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useUserSettings } from "~/actions/general";

export function CountervaluesManagedProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: CounterValuesStateRaw;
}) {
  const userSettings = useUserSettings();

  return (
    <CountervaluesProvider savedState={initialState} userSettings={userSettings}>
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
