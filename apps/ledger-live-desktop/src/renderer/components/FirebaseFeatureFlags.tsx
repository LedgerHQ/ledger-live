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

const getFeature = (args: {
  key: FeatureId;
  appLanguage?: string;
  localOverrides?: { [key in FeatureId]?: Feature };
  allowOverride?: boolean;
}) => {
  if (!AppConfig.getInstance().providerGetvalueMethod) {
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

    const value = AppConfig.getInstance().providerGetvalueMethod!["firebase"](
      formatToFirebaseFeatureId(key),
    );

    const feature = JSON.parse(value.asString());

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

export const FirebaseFeatureFlagsProvider = ({ children }: Props): JSX.Element => {
  const remoteConfig = useFirebaseRemoteConfig();

  const localOverrides = useSelector(overriddenFeatureFlagsSelector);
  const dispatch = useDispatch();

  const overrideFeature = useCallback(
    (key: FeatureId, value: Feature): void => {
      const actualRemoteValue = getFeature({ key, allowOverride: false });
      if (!isEqual(actualRemoteValue, value)) {
        const { overriddenByEnv, ...pureValue } = value; // eslint-disable-line
        const overridenValue = { ...pureValue, overridesRemote: true };
        dispatch(setOverriddenFeatureFlag({ key, value: overridenValue }));
      } else {
        dispatch(setOverriddenFeatureFlag({ key, value: undefined }));
      }
    },
    [dispatch],
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

  // Nb wrapped because the method is also called from outside.
  const wrappedGetFeature = useCallback(
    <T extends FeatureId>(key: T): Features[T] => getFeature({ key, localOverrides }),
    [localOverrides],
  );

  useEffect(() => {
    if (remoteConfig) {
      setAnalyticsFeatureFlagMethod(wrappedGetFeature);
    }
    return () => setAnalyticsFeatureFlagMethod(null);
  }, [remoteConfig, wrappedGetFeature]);

  const contextValue = useMemo(
    () => ({
      isFeature,
      getFeature: wrappedGetFeature,
      overrideFeature,
      resetFeature,
      resetFeatures,
    }),
    [wrappedGetFeature, overrideFeature, resetFeature, resetFeatures],
  );

  return <FeatureFlagsProvider value={contextValue}>{children}</FeatureFlagsProvider>;
};
