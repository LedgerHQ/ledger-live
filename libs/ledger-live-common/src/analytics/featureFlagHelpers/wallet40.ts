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
    graphRework: wallet40FeatureFlag?.params?.graphRework ?? false,
    tour: wallet40FeatureFlag?.params?.tour ?? false,
    q2Tour: wallet40FeatureFlag?.params?.q2Tour ?? false,
    lazyOnboarding: wallet40FeatureFlag?.params?.lazyOnboarding ?? false,
    assetSection: wallet40FeatureFlag?.params?.assetSection ?? false,
    brazePlacement: wallet40FeatureFlag?.params?.brazePlacement ?? false,
    operationsList: wallet40FeatureFlag?.params?.operationsList ?? false,
    myWallet: wallet40FeatureFlag?.params?.myWallet ?? false,
    assetDiscoverability: wallet40FeatureFlag?.params?.assetDiscoverability ?? false,
    aggregatedAssets: wallet40FeatureFlag?.params?.aggregatedAssets ?? false,
    pnl: wallet40FeatureFlag?.params?.pnl ?? false,
    earnUpselling: wallet40FeatureFlag?.params?.earnUpselling ?? false,
    earnSimulator: wallet40FeatureFlag?.params?.earnSimulator ?? false,
  };
};
