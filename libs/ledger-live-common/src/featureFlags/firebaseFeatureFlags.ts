import { PropsWithChildren } from "react";
import { snakeCase } from "lodash";
import semver from "semver";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

export type FirebaseFeatureFlagsProviderProps = PropsWithChildren<unknown>;
export const formatToFirebaseFeatureId = (id: string) => `feature_${snakeCase(id)}`;

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

export const isFeature = (key: string): boolean => {
  if (!LiveConfig.instance?.provider?.getValueByKey) {
    return false;
  }
  try {
    const value = LiveConfig.getValueByKey(formatToFirebaseFeatureId(key));
    if (!value) {
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Failed to check if feature "${key}" exists`);
    return false;
  }
};

export const getFeature = (args: {
  key: FeatureId;
  appLanguage?: string;
  localOverrides?: { [key in FeatureId]?: Feature };
  allowOverride?: boolean;
}) => {
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
  } catch (error) {
    console.error(`Failed to retrieve feature "${key}"`);
    return null;
  }
};
