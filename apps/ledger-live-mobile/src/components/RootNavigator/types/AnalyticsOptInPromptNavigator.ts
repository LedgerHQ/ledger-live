import { ScreenName } from "~/const";

export type EntryPoint = "Onboarding" | "Portfolio";

export type AnalyticsOptInPromptNavigatorParamList = {
  [ScreenName.AnalyticsOptInPromptMain]: { entryPoint: EntryPoint };
  [ScreenName.AnalyticsOptInPromptDetails]: { entryPoint: EntryPoint };
};
