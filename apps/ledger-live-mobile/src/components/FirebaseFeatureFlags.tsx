import React, { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import isEqual from "lodash/isEqual";
import {
  FeatureFlagsProvider,
  DEFAULT_FEATURES,
  isFeature,
  getFeature,
<<<<<<< HEAD
<<<<<<< HEAD
} from "@ledgerhq/live-config/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-config/featureFlags/index";
=======
} from "@ledgerhq/live-config/FeatureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-config/FeatureFlags/index";
>>>>>>> f8e0133b13 (fix: refactoring)
=======
} from "@ledgerhq/live-config/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-config/featureFlags/index";
>>>>>>> 5795ae130c (fix: snackcase for folder name)
import { FeatureId, Feature, Features } from "@ledgerhq/types-live";
import { languageSelector, overriddenFeatureFlagsSelector } from "../reducers/settings";
import { setOverriddenFeatureFlag, setOverriddenFeatureFlags } from "../actions/settings";
import { setAnalyticsFeatureFlagMethod } from "../analytics/segment";

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
