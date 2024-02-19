import { ScreenName } from "~/const";

export type AnalyticsOptInPromptNavigatorParamList = {
  [ScreenName.AnalyticsOptInPromptMain]: { entryPoint?: "Onboarding" | "Portfolio" };
  [ScreenName.AnalyticsOptInPromptDetails]: { entryPoint?: "Onboarding" | "Portfolio" };
};
