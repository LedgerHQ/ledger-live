import React, { useCallback, useState, ReactNode, useEffect } from "react";
import isEqual from "lodash/isEqual";
import semver from "semver";
import { FeatureFlagsProvider } from "@ledgerhq/live-common/featureFlags/index";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { getValue } from "firebase/remote-config";
import { getAppVersion } from "../../../tools/utils/appVersion";

import { formatFeatureId, useFirebaseRemoteConfig } from "./FirebaseRemoteConfig";

type Props = {
  children?: ReactNode;
};

export const FirebaseFeatureFlagsProvider = ({ children }: Props): JSX.Element | null => {
  const remoteConfig = useFirebaseRemoteConfig();
  const [localOverrides, setLocalOverrides] = useState({});
  const [appVersion, setAppVersion] = useState();
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    console.log("USE EFFECT");
    getAppVersion()
      .then(version => {
        console.log("APP VERSION", version);
        setAppVersion(version);
        setLoaded(true);
      })
      .catch(error => {
        console.error(`Failed to get app version with error: ${error}`);
        setLoaded(true);
      });
  }, []);

  const getFeature = useCallback(
    (key: FeatureId, allowOverride = true): Feature | null => {
      if (!remoteConfig) {
        return null;
      }

      try {
        // Nb prioritize local overrides
        if (allowOverride && localOverrides[key]) {
          return localOverrides[key];
        }

        const value = getValue(remoteConfig, formatFeatureId(key));
        const feature: Feature = JSON.parse(value.asString());

        console.log("FEATURE :", key, semver.satisfies(appVersion, "2.0.0"));
        if (
          feature.enabled &&
          feature.desktop_version &&
          !semver.satisfies(appVersion, feature.desktop_version)
        ) {
          return {
            enabledOverriddenForCurrentDesktopVersion: true,
            ...feature,
            enabled: false,
          };
        }

        return feature;
      } catch (error) {
        console.error(`Failed to retrieve feature "${key}"`);
        return null;
      }
    },
    [localOverrides, remoteConfig, appVersion],
  );

  const overrideFeature = useCallback(
    (key: FeatureId, value: Feature): void => {
      const actualRemoteValue = getFeature(key, false);
      if (!isEqual(actualRemoteValue, value)) {
        const overridenValue = { ...value, overridesRemote: true };
        setLocalOverrides(currentOverrides => ({ ...currentOverrides, [key]: overridenValue }));
      } else {
        setLocalOverrides(currentOverrides => ({ ...currentOverrides, [key]: undefined }));
      }
    },
    [getFeature],
  );

  const resetFeature = (key: FeatureId): void => {
    setLocalOverrides(currentOverrides => ({ ...currentOverrides, [key]: undefined }));
  };

  if (!loaded) {
    return null;
  }

  return (
    <FeatureFlagsProvider
      getFeature={getFeature}
      overrideFeature={overrideFeature}
      resetFeature={resetFeature}
    >
      {children}
    </FeatureFlagsProvider>
  );
};
