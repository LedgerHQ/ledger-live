import React, { useEffect, useState } from "react";
import { getRemoteConfig } from "@react-native-firebase/remote-config";
import { DEFAULT_FEATURES, formatDefaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { FirebaseRemoteConfigProvider as FirebaseProvider } from "@ledgerhq/live-config/providers/index";

const FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const FirebaseRemoteConfigProvider = ({
  children,
}: {
  children: React.ReactElement;
}): JSX.Element | null => {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    let unmounted = false;

    const rc = getRemoteConfig();

    LiveConfig.setProvider(
      new FirebaseProvider({
        getValue: (key: string) => rc.getValue(key),
      }),
    );

    const fetchConfig = async () => {
      try {
        await rc.setConfigSettings({ minimumFetchIntervalMillis: 0 });
        await rc.setDefaults(formatDefaultFeatures(DEFAULT_FEATURES));
        await rc.fetchAndActivate();
      } catch (error) {
        if (!unmounted) {
          console.error(`Failed to fetch Firebase remote config with error:`, error);
        }
      } finally {
        if (!unmounted) {
          setLoaded(true);
        }
      }
    };

    fetchConfig();

    const intervalId = setInterval(fetchConfig, FETCH_INTERVAL);

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
