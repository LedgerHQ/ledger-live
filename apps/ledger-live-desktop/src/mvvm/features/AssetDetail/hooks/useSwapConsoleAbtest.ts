import { useFeature } from "@features/platform-feature-flags";

export type SwapConsoleAbtest = Readonly<{
  isConsoleEnabled: boolean;
  isQuickActionEnabled: boolean;
}>;

export function useSwapConsoleAbtest(): SwapConsoleAbtest {
  const swapConsoleAbtest = useFeature("lwdSwapConsoleAbtest");

  if (!swapConsoleAbtest?.enabled) {
    return { isConsoleEnabled: true, isQuickActionEnabled: false };
  }

  return {
    isConsoleEnabled: swapConsoleAbtest.params?.console ?? true,
    isQuickActionEnabled: swapConsoleAbtest.params?.quickAction ?? false,
  };
}
