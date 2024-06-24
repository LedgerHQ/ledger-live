import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

// used to get the value of the Swap Live App flag
export const useIsSwapLiveFlagEnabled = (flag: string): boolean => {
  const demoZero = useFeature("ptxSwapLiveAppDemoZero");
  const demoOne = useFeature("ptxSwapLiveAppDemoOne");

  if (demoZero?.enabled === demoOne?.enabled) return false;

  switch (flag) {
    case "ptxSwapLiveAppDemoOne":
      return Boolean(demoOne?.enabled);
    case "ptxSwapLiveAppDemoZero":
      return Boolean(demoZero?.enabled && !demoOne?.enabled);
    default:
      throw new Error(`Unknown Swap Live App flag: ${flag}`);
  }
};
