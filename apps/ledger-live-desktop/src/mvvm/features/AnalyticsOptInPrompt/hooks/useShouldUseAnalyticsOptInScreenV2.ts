import { useFeature } from "@features/platform-feature-flags";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";

export function useShouldUseAnalyticsOptInScreenV2(entryPoint: EntryPoint): boolean {
  const lldAnalyticsOptInPrompt = useFeature("lldAnalyticsOptInPrompt");
  const lwdAnalyticsOptInScreenV2 = useFeature("lwdAnalyticsOptInScreenV2");

  return (
    entryPoint === EntryPoint.onboarding &&
    Boolean(lldAnalyticsOptInPrompt?.enabled) &&
    lldAnalyticsOptInPrompt?.params?.variant === "B" &&
    Boolean(lwdAnalyticsOptInScreenV2?.enabled)
  );
}
