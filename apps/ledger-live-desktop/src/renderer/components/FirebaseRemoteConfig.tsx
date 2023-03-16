import React, { ReactNode, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getRemoteConfig, fetchAndActivate, RemoteConfig } from "firebase/remote-config";
import { defaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import { DefaultFeatures } from "@ledgerhq/types-live";
import reduce from "lodash/reduce";
import snakeCase from "lodash/snakeCase";

import { getFirebaseConfig } from "~/firebase-setup";

export const FirebaseRemoteConfigContext = React.createContext<RemoteConfig | null>(null);

export const useFirebaseRemoteConfig = () => useContext(FirebaseRemoteConfigContext);

export const formatToFirebaseFeatureId = (id: string) => `feature_${snakeCase(id)}`;

// Firebase SDK treat JSON values as strings
const formatDefaultFeatures = (config: DefaultFeatures) =>
  reduce(
    config,
    (acc, feature, featureId) => ({
      ...acc,
      [formatToFirebaseFeatureId(featureId)]: JSON.stringify(feature),
    }),
    {},
  );

type Props = {
  children?: ReactNode;
};

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
          ...formatDefaultFeatures(defaultFeatures),
        };
        await fetchAndActivate(remoteConfig);
        setConfig(remoteConfig);
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
