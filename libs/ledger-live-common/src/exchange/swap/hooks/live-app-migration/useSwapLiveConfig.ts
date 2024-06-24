import { useFeature } from "../../../../featureFlags";

// used to enable the Swap Live App globally
export function useSwapLiveConfig() {
  const demoZero = useFeature("ptxSwapLiveAppDemoZero");
  const demoOne = useFeature("ptxSwapLiveAppDemoOne");

  if (demoZero?.enabled === demoOne?.enabled) return null;

  return demoZero?.enabled && !demoOne?.enabled ? demoZero : demoOne?.enabled ? demoOne : null;
}
