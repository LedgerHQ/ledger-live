import React, { useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getRemoteConfig, fetchAndActivate, RemoteConfig, getValue } from "firebase/remote-config";
import {
  DEFAULT_FEATURES,
  formatDefaultFeatures,
  LiveConfig,
} from "@ledgerhq/live-common/featureFlags/index";
import type { FirebaseFeatureFlagsProviderProps as Props } from "@ledgerhq/live-common/featureFlags/index";
import { getFirebaseConfig } from "~/firebase-setup";

LiveConfig.init({
  appVersion: __APP_VERSION__,
  platform: "desktop",
  environment: process.env.NODE_ENV || "development",
});

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

    const fetchConfig = async () => {
      try {
        const remoteConfig = getRemoteConfig();

        if (__DEV__) {
          remoteConfig.settings.minimumFetchIntervalMillis = 0;
        }

        remoteConfig.defaultConfig = {
          ...formatDefaultFeatures(DEFAULT_FEATURES),
        };
        await fetchAndActivate(remoteConfig);
        setConfig(remoteConfig);
        LiveConfig.setProviderGetValueMethod({
          firebase: (key: string) => {
            return getValue(remoteConfig, key);
          },
        });
      } catch (error) {
        console.error(`Failed to fetch Firebase remote config with error: ${error}`);
      }

      setLoaded(true);
    };

    fetchConfig();
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
