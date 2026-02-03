import type { AnalyticsFeatureFlagMethod, Platform } from "../types";

const FEATURE_FLAG_KEYS = {
  lwm: "lwmWallet40",
  lwd: "lwdWallet40",
} as const;

export const getWallet40Attributes = (
  analyticsFeatureFlagMethod: AnalyticsFeatureFlagMethod | null,
  platform: Platform,
) => {
  if (!analyticsFeatureFlagMethod) return false;

  const featureFlagKey = FEATURE_FLAG_KEYS[platform];
  const wallet40FeatureFlag = analyticsFeatureFlagMethod(featureFlagKey);
  const isEnabled = wallet40FeatureFlag?.enabled ?? false;

  return {
    isEnabled,
    marketBanner: wallet40FeatureFlag?.params?.marketBanner ?? false,
    graphRework: wallet40FeatureFlag?.params?.graphRework ?? false,
    quickActionCtas: wallet40FeatureFlag?.params?.quickActionCtas ?? false,
    tour: wallet40FeatureFlag?.params?.tour ?? false,
    mainNavigation: wallet40FeatureFlag?.params?.mainNavigation ?? false,
    newReceiveDialog: wallet40FeatureFlag?.params?.newReceiveDialog ?? false,
  };
};
