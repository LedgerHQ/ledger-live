import React, { useCallback, useEffect, useMemo } from "react";
import isEqual from "lodash/isEqual";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { FeatureFlagsProvider, isFeature } from "@ledgerhq/live-common/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-common/featureFlags/index";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { useFirebaseRemoteConfig } from "./FirebaseRemoteConfig";
import { overriddenFeatureFlagsSelector } from "../reducers/settings";
import {
  setOverriddenFeatureFlag,
  setOverriddenFeatureFlags,
  setSelectedTimeRange,
} from "../actions/settings";
import { setAnalyticsFeatureFlagMethod } from "../analytics/segment";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/useWalletFeaturesConfig";

export const FirebaseFeatureFlagsProvider = ({
  children,
  getFeature,
}: Props): React.JSX.Element => {
  const { config: remoteConfig } = useFirebaseRemoteConfig();

  const dispatch = useDispatch();
  const localOverrides = useSelector(overriddenFeatureFlagsSelector);
  const { shouldDisplayGraphRework: isWallet40GraphReworkEnabled } =
    useWalletFeaturesConfig("desktop");

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

  // That's temporary until wallet 4.0 is 100% enabled
  // We need to set the selected time range to day at each app launch for the wallet 4.0 feature flag
  useEffect(() => {
    if (isWallet40GraphReworkEnabled) {
      dispatch(setSelectedTimeRange("day"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only once
  }, []);

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
