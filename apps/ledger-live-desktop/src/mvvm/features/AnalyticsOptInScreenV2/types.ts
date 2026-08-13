export type AnalyticsOptInScreenStep = "main" | "preferences";

export const ANALYTICS_OPT_IN_SCREEN_FLOW = "consent onboarding";

export const ANALYTICS_OPT_IN_SCREEN_PAGES = {
  main: "Analytics opt-in screen main",
  preferences: "Analytics opt-in screen preferences",
} as const;

export type { AnalyticsOptInPromptHostProps as AnalyticsOptInScreenHostProps } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
