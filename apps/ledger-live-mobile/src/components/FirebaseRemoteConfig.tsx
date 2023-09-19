import React, { useEffect, useState } from "react";
import remoteConfig from "@react-native-firebase/remote-config";
import { DEFAULT_FEATURES, formatDefaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-common/featureFlags/index";

export const FirebaseRemoteConfigProvider = ({ children }: Props): JSX.Element | null => {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    let unmounted = false;
    const loadRemoteConfig = async () => {
      try {
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
    loadRemoteConfig();

    return () => {
      unmounted = true;
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return <>{children}</>;
};
