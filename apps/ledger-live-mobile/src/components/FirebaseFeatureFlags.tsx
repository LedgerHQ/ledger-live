import React, { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import isEqual from "lodash/isEqual";
import {
  FeatureFlagsProvider,
  DEFAULT_FEATURES,
  isFeature,
  getFeature,
} from "@ledgerhq/live-config/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-config/featureFlags/index";
import { FeatureId, Feature, Features } from "@ledgerhq/types-live";
import { languageSelector, overriddenFeatureFlagsSelector } from "../reducers/settings";
import { setOverriddenFeatureFlag, setOverriddenFeatureFlags } from "../actions/settings";
import { setAnalyticsFeatureFlagMethod } from "../analytics/segment";

<<<<<<< HEAD
=======
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

    const value = remoteConfig().getValue(formatToFirebaseFeatureId(key));
    const feature = JSON.parse(value.asString());

    if (
      feature.enabled &&
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

>>>>>>> f26e979d8c (refactoring)
/**
 * @returns all flags that have different defaults are exported as a key value map
 */
export const getAllDivergedFlags = (
  appLanguage: string,
): Partial<{ [key in FeatureId]: boolean }> => {
  const res: Partial<{ [key in FeatureId]: boolean }> = {};
  Object.keys(DEFAULT_FEATURES).forEach(k => {
    const key = k as keyof typeof DEFAULT_FEATURES;
    const value = getFeature({ key, appLanguage });
    if (value && value.enabled !== DEFAULT_FEATURES[key]?.enabled) {
      res[key] = value.enabled;
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

  const resetFeature = useCallback(
    (key: FeatureId): void => {
      dispatch(setOverriddenFeatureFlag({ id: key, value: undefined }));
    },
    [dispatch],
  );

  const resetFeatures = useCallback((): void => {
    dispatch(setOverriddenFeatureFlags({}));
  }, [dispatch]);

  const wrappedGetFeature = useCallback(
    <T extends FeatureId>(key: T): Features[T] => getFeature({ key, appLanguage, localOverrides }),
    [localOverrides, appLanguage],
  );

  useEffect(() => {
    setAnalyticsFeatureFlagMethod(wrappedGetFeature);
    return () => setAnalyticsFeatureFlagMethod(null);
  }, [wrappedGetFeature]);

  const contextValue = useMemo(
    () => ({
      isFeature,
      getFeature: wrappedGetFeature,
      overrideFeature,
      resetFeature,
      resetFeatures,
    }),
    [overrideFeature, resetFeature, resetFeatures, wrappedGetFeature],
  );

  return <FeatureFlagsProvider value={contextValue}>{children}</FeatureFlagsProvider>;
};
