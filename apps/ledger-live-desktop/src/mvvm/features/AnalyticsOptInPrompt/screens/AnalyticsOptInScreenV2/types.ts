export type AnalyticsOptInScreenV2Step = "main" | "preferences";

export const ANALYTICS_OPT_IN_SCREEN_B_VARIANT = "B";

export const ANALYTICS_OPT_IN_SCREEN_B_FLOW = "consent onboarding";

export const ANALYTICS_OPT_IN_SCREEN_B_PAGES = {
  main: "Analytics opt-in screen B main",
  preferences: "Analytics opt-in screen B preferences",
} as const;

export type AnalyticsOptInScreenV2HostProps = Readonly<{
  isOpened?: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}>;
