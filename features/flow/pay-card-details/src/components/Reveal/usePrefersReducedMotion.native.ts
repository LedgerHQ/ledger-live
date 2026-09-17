import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const onChange = (enabled: boolean) => setReduced(enabled);
    const subscription = AccessibilityInfo?.addEventListener?.("reduceMotionChanged", onChange);
    void AccessibilityInfo?.isReduceMotionEnabled?.()?.then(onChange);
    return () => subscription?.remove();
  }, []);

  return reduced;
}
