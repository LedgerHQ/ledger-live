import { useFeature } from "@features/platform-feature-flags";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";

/** V2 Welcome screen is gated only by `lwdAnalyticsOptInScreenV2` (onboarding only). */
export function useShouldUseAnalyticsOptInScreenV2(entryPoint: EntryPoint): boolean {
  const lwdAnalyticsOptInScreenV2 = useFeature("lwdAnalyticsOptInScreenV2");

  return entryPoint === EntryPoint.onboarding && Boolean(lwdAnalyticsOptInScreenV2?.enabled);
}
