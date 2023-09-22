import { PropsWithChildren } from "react";
import { snakeCase } from "lodash";
import semver from "semver";
import { Feature } from "@ledgerhq/types-live";

export class AppConfig {
  public appVersion?: string;
  public platform?: string;
  public environment?: string;
  private static instance: AppConfig;
  private constructor() {}
  public static init(config: { appVersion: string; platform: string; environment: string }) {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
      AppConfig.instance.appVersion = config.appVersion;
      AppConfig.instance.platform = config.platform;
    } else {
      throw new Error("AppConfig instance is already initialized");
    }
  }
  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      throw new Error("AppConfig instance is not initialized. Call init() first.");
    }
    return AppConfig.instance;
  }
}

export type FirebaseFeatureFlagsProviderProps = PropsWithChildren<unknown>;
export const formatToFirebaseFeatureId = (id: string) => `feature_${snakeCase(id)}`;

export const checkFeatureFlagVersion = (feature: Feature) => {
  const platform = AppConfig.getInstance().platform;
  if (feature && feature.enabled && platform) {
    let featureSpecificVersion: string | undefined;
    if (platform === "desktop") {
      featureSpecificVersion = feature.desktop_version;
    }
    if (["ios", "android"].includes(platform)) {
      featureSpecificVersion = feature.mobile_version;
    }
    if (
      featureSpecificVersion &&
      !semver.satisfies(AppConfig.getInstance().appVersion, featureSpecificVersion, {
        includePrerelease: true,
      })
    ) {
      return {
        enabledOverriddenForCurrentVersion: true,
        ...feature,
        enabled: false,
      };
    }
  }
  return feature;
};
