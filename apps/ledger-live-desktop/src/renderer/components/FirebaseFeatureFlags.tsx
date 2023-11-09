import React, { useCallback, ReactNode, useEffect, useMemo } from "react";
import isEqual from "lodash/isEqual";
import semver from "semver";
import { useDispatch, useSelector } from "react-redux";
import { FeatureFlagsProvider } from "@ledgerhq/live-common/featureFlags/index";
import { Feature, FeatureId, Features } from "@ledgerhq/types-live";
import { getAll, getValue } from "firebase/remote-config";
import { getEnv } from "@ledgerhq/live-env";
import { formatToFirebaseFeatureId, useFirebaseRemoteConfig } from "./FirebaseRemoteConfig";
import { overriddenFeatureFlagsSelector } from "../reducers/settings";
import { setOverriddenFeatureFlag, setOverriddenFeatureFlags } from "../actions/settings";
import { setAnalyticsFeatureFlagMethod } from "../analytics/segment";

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

  const getAllFlags = useCallback((): Record<string, Feature> => {
    if (remoteConfig) {
      const allFeatures = getAll(remoteConfig);
      const parsedFeatures = Object.entries(allFeatures).map(([key, value]) => {
        return [key, JSON.parse(value.asString())];
      });

      return Object.fromEntries(parsedFeatures);
    }

    return {};
  }, [remoteConfig]);

  const isFeature = useCallback(
    (key: string): boolean => {
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
    },
    [remoteConfig],
  );

  const getFeature = useCallback(
    <T extends FeatureId>(key: T, allowOverride = true): Feature<Features[T]["params"]> | null => {
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

  const resetFeature = useCallback(
    (key: FeatureId): void => {
      dispatch(setOverriddenFeatureFlag(key, undefined));
    },
    [dispatch],
  );

  const resetFeatures = useCallback((): void => {
    dispatch(setOverriddenFeatureFlags({}));
  }, [dispatch]);

  useEffect(() => {
    if (remoteConfig) {
      setAnalyticsFeatureFlagMethod(getFeature);
    }

    return () => setAnalyticsFeatureFlagMethod(null);
  }, [remoteConfig, getFeature]);

  const contextValue = useMemo(
    () => ({
      isFeature,
      getFeature,
      overrideFeature,
      resetFeature,
      resetFeatures,
      getAllFlags,
    }),
    [getAllFlags, getFeature, isFeature, overrideFeature, resetFeature, resetFeatures],
  );

  return <FeatureFlagsProvider value={contextValue}>{children}</FeatureFlagsProvider>;
};
