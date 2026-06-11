import type { AnalyticsFeatureFlagMethod, Platform } from "../types";

const ONBOARDING_COUNTERFEIT_WARNING_FLAG_KEYS = {
  lwm: "lwmOnboardingCounterfeitWarning",
  lwd: "lwdOnboardingCounterfeitWarning",
} as const;

export const getOnboardingCounterfeitWarningAttributes = (
  analyticsFeatureFlagMethod: AnalyticsFeatureFlagMethod | null,
  platform: Platform,
) => {
  const featureFlagKey = ONBOARDING_COUNTERFEIT_WARNING_FLAG_KEYS[platform];
  const enabled = analyticsFeatureFlagMethod?.(featureFlagKey)?.enabled ?? false;

  return {
    [featureFlagKey]: enabled,
  };
};
