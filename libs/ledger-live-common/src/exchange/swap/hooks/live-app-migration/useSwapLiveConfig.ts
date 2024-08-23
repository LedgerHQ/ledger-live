import { useFeature } from "../../../../featureFlags";

// used to enable the Swap Live App globally
export function useSwapLiveConfig() {
  const demoZero = useFeature("ptxSwapLiveAppDemoZero");
  const demoOne = useFeature("ptxSwapLiveAppDemoOne");
  const demoThree = useFeature("ptxSwapLiveAppDemoThree");

  // Order is important in order to get the first enabled flag
  const flags = [demoThree, demoOne, demoZero];
  const enabledFlag = flags.find(flag => flag?.enabled);

  return enabledFlag ?? null;
}
