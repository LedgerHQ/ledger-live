import React, { PropsWithChildren, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import isEqual from "lodash/isEqual";
import semver from "semver";
import remoteConfig from "@react-native-firebase/remote-config";
import VersionNumber from "react-native-version-number";
import {
  FeatureFlagsProvider,
  defaultFeatures,
} from "@ledgerhq/live-common/featureFlags/index";
import { FeatureId, Feature } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-common/env";

import { formatToFirebaseFeatureId } from "./FirebaseRemoteConfig";
import {
  languageSelector,
  overriddenFeatureFlagsSelector,
} from "../reducers/settings";
import {
  setOverriddenFeatureFlag,
  setOverriddenFeatureFlags,
} from "../actions/settings";

type Props = PropsWithChildren<unknown>;

const checkFeatureFlagVersion = (feature: Feature | undefined) => {
  if (
    feature &&
    feature.enabled &&
    feature.mobile_version &&
    !semver.satisfies(VersionNumber.appVersion, feature.mobile_version, {
      includePrerelease: true,
    })
  ) {
    return {
      enabledOverriddenForCurrentMobileVersion: true,
      ...feature,
      enabled: false,
    };
  }
  return feature;
};

const isFeature = (key: string): boolean => {
  try {
    const value = remoteConfig().getValue(formatToFirebaseFeatureId(key));

    if (!value || !value.asString()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Failed to check if feature "${key}" exists`);
    return false;
  }
};

const getFeature = (args: {
  key: FeatureId;
  appLanguage: string;
  localOverrides?: { [key in FeatureId]?: Feature };
  allowOverride?: boolean;
}) => {
  const { key, appLanguage, localOverrides, allowOverride = true } = args;
  try {
    // Nb prioritize local overrides
    if (allowOverride && localOverrides && localOverrides[key]) {
      return checkFeatureFlagVersion(localOverrides[key]);
    }

    const envFlags = getEnv("FEATURE_FLAGS") as
      | { [key in FeatureId]?: Feature }
      | undefined;

    if (allowOverride && envFlags) {
      const feature = envFlags[key];
      if (feature)
        return {
          ...feature,
          overridesRemote: true,
          overriddenByEnv: true,
        };
    }
    const config = remoteConfig();

    if (__DEV__) {
      config.setConfigSettings({ minimumFetchIntervalMillis: 0 });
    }

    const value = remoteConfig().getValue(formatToFirebaseFeatureId(key));
    const feature = JSON.parse(value.asString());

    if (
      feature.enabled &&
      ((feature.languages_whitelisted &&
        !feature.languages_whitelisted.includes(appLanguage)) ||
        (feature.languages_blacklisted &&
          feature.languages_blacklisted.includes(appLanguage)))
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

/**
 * @returns all flags that have different defaults are exported as a key value map
 */
export const getAllDivergedFlags = (
  appLanguage: string,
): Partial<{ [key in FeatureId]: boolean }> => {
  const res: Partial<{ [key in FeatureId]: boolean }> = {};
  Object.keys(defaultFeatures).forEach(key => {
    const value = getFeature({ key: key as FeatureId, appLanguage });
    if (value && value.enabled !== defaultFeatures[key as FeatureId]?.enabled) {
      res[key as FeatureId] = value.enabled;
    }
  });
  return res;
};

export const FirebaseFeatureFlagsProvider: React.FC<Props> = ({ children }) => {
  const localOverrides = useSelector(overriddenFeatureFlagsSelector);
  const dispatch = useDispatch();

  const appLanguage = useSelector(languageSelector);

  const overrideFeature = useCallback(
    (key: FeatureId, value: Feature): void => {
      const actualRemoteValue = getFeature({
        key,
        appLanguage,
        allowOverride: false,
      });
      if (!isEqual(actualRemoteValue, value)) {
        const { overriddenByEnv: _, ...pureValue } = value;
        const overridenValue = { ...pureValue, overridesRemote: true };
        dispatch(setOverriddenFeatureFlag({ id: key, value: overridenValue }));
      } else {
        dispatch(setOverriddenFeatureFlag({ id: key, value: undefined }));
      }
    },
    [appLanguage, dispatch],
  );

  const resetFeature = (key: FeatureId): void => {
    dispatch(setOverriddenFeatureFlag({ id: key, value: undefined }));
  };

  const resetFeatures = (): void => {
    dispatch(setOverriddenFeatureFlags({}));
  };

  // Nb wrapped because the method is also called from outside.
  const wrappedGetFeature = useCallback(
    (key: FeatureId): Feature =>
      getFeature({ key, appLanguage, localOverrides }),
    [localOverrides, appLanguage],
  );

  return (
    <FeatureFlagsProvider
      isFeature={isFeature}
      getFeature={wrappedGetFeature}
      overrideFeature={overrideFeature}
      resetFeature={resetFeature}
      resetFeatures={resetFeatures}
    >
      {children}
    </FeatureFlagsProvider>
  );
};
