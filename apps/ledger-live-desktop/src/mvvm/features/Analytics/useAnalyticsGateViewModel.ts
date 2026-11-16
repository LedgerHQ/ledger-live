import { useFeature } from "@features/platform-feature-flags";

export function useAnalyticsGateViewModel() {
  return { enabled: useFeature("accountDetail")?.enabled ?? false };
}
