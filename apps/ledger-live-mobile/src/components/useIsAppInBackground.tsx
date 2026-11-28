import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

type Options = {
  /** With `false`, only `background` counts: iOS is also `inactive` while a system alert shows. */
  includeInactive?: boolean;
};

function isBackground(appState: AppStateStatus, includeInactive: boolean): boolean {
  return includeInactive ? appState !== "active" : appState === "background";
}

export default function useIsAppInBackground({ includeInactive = true }: Options = {}) {
  const [appState, setAppState] = useState(AppState.currentState);
  useEffect(() => {
    const listener = AppState.addEventListener("change", setAppState);
    return () => {
      listener.remove();
    };
  }, []);
  return isBackground(appState, includeInactive);
}
