import { useFeature } from "@features/platform-feature-flags";
import { isAccountDetailAnalyticsBannerEnabled } from "../logic/isAccountDetailAnalyticsBannerEnabled";

export function useAccountDetailAnalyticsBannerFeature(): boolean {
  return isAccountDetailAnalyticsBannerEnabled(useFeature("accountDetail"));
}
