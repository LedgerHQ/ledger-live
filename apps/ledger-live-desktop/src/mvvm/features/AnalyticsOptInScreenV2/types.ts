export type AnalyticsOptInScreenStep = "main" | "preferences";

/** Kept as "B" in analytics payloads until legacy variant A is removed. */
export const ANALYTICS_OPT_IN_SCREEN_VARIANT = "B";

export const ANALYTICS_OPT_IN_SCREEN_FLOW = "consent onboarding";

export const ANALYTICS_OPT_IN_SCREEN_PAGES = {
  main: "Analytics opt-in screen B main",
  preferences: "Analytics opt-in screen B preferences",
} as const;

export type { AnalyticsOptInPromptHostProps as AnalyticsOptInScreenHostProps } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
