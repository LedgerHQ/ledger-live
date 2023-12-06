import React, { useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getRemoteConfig, fetchAndActivate, RemoteConfig, getValue } from "firebase/remote-config";
import {
  DEFAULT_FEATURES,
  formatDefaultFeatures,
  LiveConfig,
} from "@ledgerhq/live-config/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-config/featureFlags/index";
import { getFirebaseConfig } from "~/firebase-setup";

export const FirebaseRemoteConfigContext = React.createContext<RemoteConfig | null>(null);

export const useFirebaseRemoteConfig = () => useContext(FirebaseRemoteConfigContext);

export const FirebaseRemoteConfigProvider = ({ children }: Props): JSX.Element | null => {
  const [config, setConfig] = useState<RemoteConfig | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const firebaseConfig = getFirebaseConfig();
      initializeApp(firebaseConfig);
    } catch (error) {
      console.error(`Failed to initialize Firebase SDK with error: ${error}`);
      setLoaded(true);
    }
    const remoteConfig = getRemoteConfig();
    remoteConfig.settings.minimumFetchIntervalMillis = 0;
    remoteConfig.defaultConfig = {
      ...formatDefaultFeatures(DEFAULT_FEATURES),
    };
    setConfig(remoteConfig);
    LiveConfig.setProviderGetValueMethod({
      firebaseRemoteConfig: (key: string) => {
        return getValue(remoteConfig, key);
      },
    });

    const fetchAndActivateConfig = async () => {
      try {
        await fetchAndActivate(remoteConfig);
      } catch (error) {
        console.error(`Failed to fetch Firebase remote config with error: ${error}`);
      } finally {
        setLoaded(true);
      }
    };

    fetchAndActivateConfig();
    // 12 hours fetch interval. TODO: make this configurable
    const intervalId = window.setInterval(fetchAndActivateConfig, 12 * 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [setConfig]);

  if (!loaded) {
    return null;
  }

  return (
    <FirebaseRemoteConfigContext.Provider value={config}>
      {children}
    </FirebaseRemoteConfigContext.Provider>
  );
};
