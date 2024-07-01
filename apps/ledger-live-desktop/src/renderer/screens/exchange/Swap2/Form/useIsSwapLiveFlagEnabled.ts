import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

// used to get the value of the Swap Live App flag
export const useIsSwapLiveFlagEnabled = (flag: string): boolean => {
  const demoZero = useFeature("ptxSwapLiveAppDemoZero");
  const demoOne = useFeature("ptxSwapLiveAppDemoOne");
  const demoThree = useFeature("ptxSwapLiveAppDemoThree");

  if (flag === "ptxSwapLiveAppDemoThree") {
    return !!demoThree?.enabled;
  }

  if (flag === "ptxSwapLiveAppDemoOne") {
    return !!demoOne?.enabled;
  }

  if (flag === "ptxSwapLiveAppDemoZero") {
    return !!demoZero?.enabled;
  }

  throw new Error(`Unknown Swap Live App flag: ${flag}`);
};
