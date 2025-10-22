import { useEffect, useState } from "react";
import { getRemoteConfig } from "@react-native-firebase/remote-config";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_FEATURES, formatDefaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { FirebaseRemoteConfigProvider } from "@ledgerhq/live-config/providers/index";

const FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useFirebaseRemoteConfig() {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    let unmounted = false;

    const rc = getRemoteConfig();

    LiveConfig.setProvider(
      new FirebaseRemoteConfigProvider({
        getValue: (key: string) => rc.getValue(key),
      }),
    );

    const fetchConfig = async () => {
      try {
        await Promise.all([
          rc.setConfigSettings({ minimumFetchIntervalMillis: 0 }),
          rc.setDefaults(formatDefaultFeatures(DEFAULT_FEATURES)),
        ]);
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

  return loaded;
}
