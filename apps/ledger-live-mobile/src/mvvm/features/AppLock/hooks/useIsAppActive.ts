import { useEffect, useState } from "react";
import { AppState } from "react-native";

export function useIsAppActive(): boolean {
  const [isActive, setIsActive] = useState(() => AppState.currentState === "active");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextState =>
      setIsActive(nextState === "active"),
    );

    return () => subscription.remove();
  }, []);

  return isActive;
}
