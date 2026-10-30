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
  const params = wallet40FeatureFlag?.params;

  return {
    isEnabled,
    lazyOnboarding: params?.lazyOnboarding ?? false,
    assetSection: params?.assetSection ?? false,
    brazePlacement: params?.brazePlacement ?? false,
    operationsList:
      platform === "lwd" || Boolean(params && "operationsList" in params && params.operationsList),
    myWallet: platform === "lwd" || Boolean(params && "myWallet" in params && params.myWallet),
    assetDiscoverability:
      platform === "lwd" ||
      Boolean(params && "assetDiscoverability" in params && params.assetDiscoverability),
    aggregatedAssets:
      platform === "lwd" ||
      Boolean(params && "aggregatedAssets" in params && params.aggregatedAssets),
    earnUpselling: params?.earnUpselling ?? false,
    earnSimulator: params?.earnSimulator ?? false,
  };
};
