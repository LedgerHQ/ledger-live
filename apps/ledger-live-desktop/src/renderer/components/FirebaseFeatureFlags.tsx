import React, { useCallback, useEffect, useMemo } from "react";
import isEqual from "lodash/isEqual";
import { useDispatch, useSelector } from "react-redux";
import {
  FeatureFlagsProvider,
  formatToFirebaseFeatureId,
  checkFeatureFlagVersion,
  AppConfig,
  isFeature,
} from "@ledgerhq/live-common/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-common/featureFlags/index";
import { Feature, FeatureId, Features } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { useFirebaseRemoteConfig } from "./FirebaseRemoteConfig";
import { overriddenFeatureFlagsSelector } from "../reducers/settings";
import { setOverriddenFeatureFlag, setOverriddenFeatureFlags } from "../actions/settings";
import { setAnalyticsFeatureFlagMethod } from "../analytics/segment";

export const FirebaseFeatureFlagsProvider = ({ children }: Props): JSX.Element => {
  const remoteConfig = useFirebaseRemoteConfig();

  const localOverrides = useSelector(overriddenFeatureFlagsSelector);
  const dispatch = useDispatch();

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

        const value = AppConfig.getInstance().providerGetvalueMethod!["firebase"](
          formatToFirebaseFeatureId(key),
        );
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
        dispatch(setOverriddenFeatureFlag({ key, value: overridenValue }));
      } else {
        dispatch(setOverriddenFeatureFlag({ key, value: undefined }));
      }
    },
    [dispatch, getFeature],
  );

  const resetFeature = useCallback(
    (key: FeatureId): void => {
      dispatch(setOverriddenFeatureFlag({ key, value: undefined }));
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
    }),
    [getFeature, overrideFeature, resetFeature, resetFeatures],
  );

  return <FeatureFlagsProvider value={contextValue}>{children}</FeatureFlagsProvider>;
};
