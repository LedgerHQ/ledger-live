import React, { useCallback, ReactNode } from "react";
import isEqual from "lodash/isEqual";
import semver from "semver";
import { useDispatch, useSelector } from "react-redux";
import { FeatureFlagsProvider } from "@ledgerhq/live-common/featureFlags/index";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { getValue } from "firebase/remote-config";
import { getEnv } from "@ledgerhq/live-common/env";
import { formatToFirebaseFeatureId, useFirebaseRemoteConfig } from "./FirebaseRemoteConfig";
import { overriddenFeatureFlagsSelector } from "../reducers/settings";
import { setOverriddenFeatureFlag, setOverriddenFeatureFlags } from "../actions/settings";

const checkFeatureFlagVersion = (feature: Feature) => {
  if (
    feature.enabled &&
    feature.desktop_version &&
    !semver.satisfies(__APP_VERSION__, feature.desktop_version, { includePrerelease: true })
  ) {
    return {
      enabledOverriddenForCurrentDesktopVersion: true,
      ...feature,
      enabled: false,
    };
  }
  return feature;
};

type Props = {
  children?: ReactNode;
};

export const FirebaseFeatureFlagsProvider = ({ children }: Props): JSX.Element => {
  const remoteConfig = useFirebaseRemoteConfig();

  const localOverrides = useSelector(overriddenFeatureFlagsSelector);
  const dispatch = useDispatch();

  const isFeature = (key: string): boolean => {
    if (!remoteConfig) {
      return false;
    }

    try {
      const value = getValue(remoteConfig, formatToFirebaseFeatureId(key));

      if (!value || !value.asString()) {
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Failed to check if feature "${key}" exists`);
      return false;
    }
  };

  const getFeature = useCallback(
    (key: FeatureId, allowOverride = true): Feature | null => {
      if (!remoteConfig) {
        return null;
      }

      try {
        // Nb prioritize local overrides
        if (allowOverride && localOverrides[key]) {
          return checkFeatureFlagVersion(localOverrides[key]);
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

        const value = getValue(remoteConfig, formatToFirebaseFeatureId(key));
        const feature: Feature = JSON.parse(value.asString());

        return checkFeatureFlagVersion(feature);
      } catch (error) {
        console.error(`Failed to retrieve feature "${key}"`);
        return null;
      }
    },
    [localOverrides, remoteConfig],
  );

  const overrideFeature = useCallback(
    (key: FeatureId, value: Feature): void => {
      const actualRemoteValue = getFeature(key, false);
      if (!isEqual(actualRemoteValue, value)) {
        const { overriddenByEnv, ...pureValue } = value; // eslint-disable-line
        const overridenValue = { ...pureValue, overridesRemote: true };
        dispatch(setOverriddenFeatureFlag(key, overridenValue));
      } else {
        dispatch(setOverriddenFeatureFlag(key, undefined));
      }
    },
    [dispatch, getFeature],
  );

  const resetFeature = (key: FeatureId): void => {
    dispatch(setOverriddenFeatureFlag(key, undefined));
  };

  const resetFeatures = (): void => {
    dispatch(setOverriddenFeatureFlags({}));
  };

  return (
    <FeatureFlagsProvider
      isFeature={isFeature}
      getFeature={getFeature}
      overrideFeature={overrideFeature}
      resetFeature={resetFeature}
      resetFeatures={resetFeatures}
    >
      {children}
    </FeatureFlagsProvider>
  );
};
