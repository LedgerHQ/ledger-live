import React, { useEffect, useState } from "react";
import remoteConfig from "@react-native-firebase/remote-config";
import { DEFAULT_FEATURES, formatDefaultFeatures } from "@ledgerhq/live-config/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-config/featureFlags/index";
import { LiveConfig } from "@ledgerhq/live-config/featureFlags/index";

export const FirebaseRemoteConfigProvider = ({ children }: Props): JSX.Element | null => {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    let unmounted = false;
    LiveConfig.setProviderGetValueMethod({
      firebaseRemoteConfig: (key: string) => {
        return remoteConfig().getValue(key);
      },
    });
    const fetchConfig = async () => {
      try {
        remoteConfig().setConfigSettings({ minimumFetchIntervalMillis: 0 });
        await remoteConfig().setDefaults({
          ...formatDefaultFeatures(DEFAULT_FEATURES),
        });
        await remoteConfig().fetchAndActivate();
      } catch (error) {
        if (!unmounted) {
          console.error(`Failed to fetch Firebase remote config with error: ${error}`);
        }
      } finally {
        if (!unmounted) {
          setLoaded(true);
        }
      }
    };
    fetchConfig();
    // 12 hours fetch interval. TODO: make this configurable
    const intervalId = setInterval(fetchConfig, 12 * 60 * 60 * 1000);
    return () => {
      clearInterval(intervalId);
      unmounted = true;
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return <>{children}</>;
};
