import { useEffect, useState } from "react";
import { AppState } from "react-native";

export default function useIsAppInBackground() {
  const [isInBackground, setIsInBackground] = useState(
    AppState.currentState !== "active",
  );
  useEffect(() => {
    const listener = AppState.addEventListener("change", evt => {
      if (evt === "active") setIsInBackground(false);
      else setIsInBackground(true);
    });
    return () => {
      listener.remove();
    };
  });
  return isInBackground;
}
