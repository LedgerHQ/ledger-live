import semver from "semver";
import { getEnv } from "@ledgerhq/live-env";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { formatToFirebaseFeatureId } from "@features/platform-feature-flags";
import type { Feature, FeatureId, Features } from "@shared/feature-flags";

type GetFeature = <T extends FeatureId>(param: {
  key: T;
  appLanguage?: string;
  allowOverride?: boolean;
  localOverrides?: { [key in FeatureId]?: Feature | undefined };
}) => Features[T] | null;

export const checkFeatureFlagVersion = (feature: Feature) => {
  const platform = LiveConfig.instance.platform;
  if (!feature?.enabled || !platform) {
    return feature;
  }
  const featureSpecificVersion: string | undefined = (() => {
    switch (platform) {
      case "desktop":
        return feature.desktop_version;
      case "ios":
      case "android":
        return feature.mobile_version;
      default:
        return undefined;
    }
  })();
  if (
    featureSpecificVersion &&
    !semver.satisfies(LiveConfig.instance.appVersion, featureSpecificVersion, {
      includePrerelease: true,
    })
  ) {
    return {
      enabledOverriddenForCurrentVersion: true,
      ...feature,
      enabled: false,
    };
  }
  return feature;
};

/**
 * LiveConfig-backed (Firebase remote config) imperative feature-flag reader for non-React
 * call sites (e.g. reducers). React code should read the Redux slice via
 * `@features/platform-feature-flags` hooks instead.
 */
export const getFeature: GetFeature = args => {
  if (!LiveConfig.instance?.provider?.getValueByKey) {
    return null;
  }
  const { key, appLanguage, localOverrides, allowOverride = true } = args;
  try {
    // Nb prioritize local overrides
    if (allowOverride && localOverrides && localOverrides[key]) {
      const feature = localOverrides[key];
      if (feature) {
        return checkFeatureFlagVersion(feature);
      }
    }

    const envFlags = getEnv("FEATURE_FLAGS") as { [key in FeatureId]?: Feature } | undefined;

    if (allowOverride && envFlags) {
      const feature = envFlags[key];
      if (feature)
        return {
          ...feature,
          overridesRemote: true,
          overriddenByEnv: true,
        };
    }
    const feature = LiveConfig.getValueByKey(formatToFirebaseFeatureId(key));
    if (
      feature.enabled &&
      appLanguage &&
      ((feature.languages_whitelisted && !feature.languages_whitelisted.includes(appLanguage)) ||
        (feature.languages_blacklisted && feature.languages_blacklisted.includes(appLanguage)))
    ) {
      return {
        enabledOverriddenForCurrentLanguage: true,
        ...feature,
        enabled: false,
      };
    }

    return checkFeatureFlagVersion(feature);
  } catch {
    return null;
  }
};
