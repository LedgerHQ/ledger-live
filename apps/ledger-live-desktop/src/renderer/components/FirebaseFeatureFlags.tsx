import React, { useCallback, useEffect, useMemo } from "react";
import isEqual from "lodash/isEqual";
import { useDispatch, useSelector } from "react-redux";
import { FeatureFlagsProvider, isFeature } from "@ledgerhq/live-common/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-common/featureFlags/index";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { useFirebaseRemoteConfig } from "./FirebaseRemoteConfig";
import { overriddenFeatureFlagsSelector } from "../reducers/settings";
import { setOverriddenFeatureFlag, setOverriddenFeatureFlags } from "../actions/settings";
import { setAnalyticsFeatureFlagMethod } from "../analytics/segment";

export const FirebaseFeatureFlagsProvider = ({ children, getFeature }: Props): JSX.Element => {
  const { config: remoteConfig } = useFirebaseRemoteConfig();

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

  const wrappedGetFeature = useCallback(
    <T extends FeatureId>(key: T) => getFeature({ key, localOverrides }),
    [getFeature, localOverrides],
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
