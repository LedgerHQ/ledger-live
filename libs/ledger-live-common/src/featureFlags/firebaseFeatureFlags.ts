import { PropsWithChildren } from "react";
import { snakeCase } from "lodash";
import semver from "semver";
import { Feature } from "@ledgerhq/types-live";

export declare interface Value {
  asBoolean(): boolean;
  asNumber(): number;
  asString(): string;
}

export class AppConfig {
  public appVersion?: string;
  public platform?: string;
  public environment?: string;
  public providerGetvalueMethod?: { [provider: string]: (key: string) => Value };

  private static instance: AppConfig; // Singleton instance
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

  public static setProviderGetValueMethod(provider2Method: {
    [provider: string]: (key: string) => Value;
  }) {
    if (!AppConfig.instance) {
      throw new Error("AppConfig instance is not initialized. Call init() first.");
    }
    if (!AppConfig.instance.providerGetvalueMethod) {
      AppConfig.instance.providerGetvalueMethod = provider2Method;
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

export const isFeature = (key: string): boolean => {
  if (!AppConfig.getInstance().providerGetvalueMethod) {
    return false;
  }
  try {
    const value = AppConfig.getInstance().providerGetvalueMethod!["firebase"](
      formatToFirebaseFeatureId(key),
    );
    if (!value || !value.asString()) {
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Failed to check if feature "${key}" exists`);
    return false;
  }
};
