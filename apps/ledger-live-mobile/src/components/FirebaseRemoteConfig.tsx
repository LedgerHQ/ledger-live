import React, { useEffect, useState } from "react";
import remoteConfig from "@react-native-firebase/remote-config";
import {
  DEFAULT_FEATURES,
  formatDefaultFeatures,
  formatToFirebaseFeatureId,
} from "@ledgerhq/live-common/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-common/featureFlags/index";
import { LiveConfig } from "@ledgerhq/live-common/featureFlags/index";
import VersionNumber from "react-native-version-number";
import { Platform } from "react-native";

LiveConfig.init({
  appVersion: VersionNumber.appVersion,
  platform: Platform.OS,
  environment: process.env.NODE_ENV ?? "development",
});
LiveConfig.setProviderGetValueMethod({
  firebase: (key: string) => {
    return remoteConfig().getValue(formatToFirebaseFeatureId(key));
  },
});
export const FirebaseRemoteConfigProvider = ({ children }: Props): JSX.Element | null => {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    let unmounted = false;
    const fetchConfig = async () => {
      try {
        if (__DEV__) {
          remoteConfig().setConfigSettings({ minimumFetchIntervalMillis: 0 });
        }
        await remoteConfig().setDefaults({
          ...formatDefaultFeatures(DEFAULT_FEATURES),
        });
        await remoteConfig().fetchAndActivate();
      } catch (error) {
        if (!unmounted) {
          console.error(`Failed to fetch Firebase remote config with error: ${error}`);
        }
      }
      if (!unmounted) {
        setLoaded(true);
      }
    };
    fetchConfig();

    return () => {
      unmounted = true;
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return <>{children}</>;
};
