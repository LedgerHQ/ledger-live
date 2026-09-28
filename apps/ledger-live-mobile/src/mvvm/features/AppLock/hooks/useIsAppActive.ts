import { useEffect, useState } from "react";
import { AppState } from "react-native";

export function useIsAppActive(): boolean {
  // Unknown counts as active, as in the gate: on a cold start nothing would release the prompt.
  const [isActive, setIsActive] = useState(() => (AppState.currentState ?? "active") === "active");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextState =>
      setIsActive(nextState === "active"),
    );

    return () => subscription.remove();
  }, []);

  return isActive;
}
