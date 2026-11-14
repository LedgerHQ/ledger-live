import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

const isBackground = (appState: AppStateStatus) => appState === "background";

export function useIsAppInBackground(): boolean {
  const [isAppInBackground, setIsAppInBackground] = useState(() =>
    isBackground(AppState.currentState),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", appState =>
      setIsAppInBackground(isBackground(appState)),
    );
    return () => subscription.remove();
  }, []);

  return isAppInBackground;
}
