import React, { useContext, useEffect, useState } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getRemoteConfig,
  fetchAndActivate,
  RemoteConfig,
  getValue,
  getAll,
} from "firebase/remote-config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { FirebaseRemoteConfigProvider as FirebaseProvider } from "@ledgerhq/live-config/providers/index";
import { DEFAULT_FEATURES, formatDefaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import { getFirebaseConfig } from "~/firebase-setup";
import isMatch from "lodash/isMatch";
import * as fs from "fs";

export const FirebaseRemoteConfigContext = React.createContext<RemoteConfig | null>(null);

export const useFirebaseRemoteConfig = () => useContext(FirebaseRemoteConfigContext);

const parseEnvFile = (fileContent: string) => {
  const lines = fileContent.split("\n");
  const envVariables: { [key: string]: string } = {};
  lines.forEach(line => {
    const [key, value] = line.split("=");
    if (key && value) {
      // remove the double quotes from both ends of the value
      envVariables[key.trim()] = value.trim().replace(/^"(.*)"$/, "$1");
    }
  });
  return envVariables;
};

export const FirebaseRemoteConfigProvider = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element | null => {
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

    LiveConfig.setProvider(
      new FirebaseProvider({
        getValue: (key: string) => {
          return getValue(remoteConfig, key);
        },
      }),
    );

    // check whether local default settings and firebase remote settings are consistent
    const warnOnConfigMismatch = async () => {
      if (!__DEV__) {
        return;
      }
      const envs = ["production", "staging", "testing", "development"];
      envs.forEach(async (env: string) => {
        const envFilePath = `./.env.${env}`;
        let apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, envVars;
        try {
          const fileContent = fs.readFileSync(envFilePath, "utf8");
          envVars = parseEnvFile(fileContent);
          apiKey = envVars["FIREBASE_API_KEY"];
          authDomain = envVars["FIREBASE_AUTH_DOMAIN"];
          projectId = envVars["FIREBASE_PROJECT_ID"];
          storageBucket = envVars["FIREBASE_STORAGE_BUCKET"];
          messagingSenderId = envVars["FIREBASE_MESSAGING_SENDER_ID"];
          appId = envVars["FIREBASE_APP_ID"];
        } catch (error) {
          apiKey = undefined;
        }

        const firebaseOptions = apiKey
          ? { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }
          : getFirebaseConfig();
        const firebaseApp = initializeApp(firebaseOptions, env);
        const remoteConfig = getRemoteConfig(firebaseApp);
        remoteConfig.settings.minimumFetchIntervalMillis = 0;
        await fetchAndActivate(remoteConfig);
        const allConfigs = getAll(remoteConfig);
        for (const key in allConfigs) {
          if (key.startsWith("config_")) {
            const value = allConfigs[key].asString();
            const configType = LiveConfig.instance.config[key]?.type;
            if (configType === "object" || configType === "array") {
              if (!isMatch(LiveConfig.getDefaultValueByKey(key) as object, JSON.parse(value))) {
                console.warn(
                  `Config mismatch for ${key} in ${env}, Remote: ${value}, Local: ${JSON.stringify(
                    LiveConfig.getDefaultValueByKey(key),
                  )}`,
                );
              }
            } else {
              if (LiveConfig.getDefaultValueByKey(key)?.toString() !== value) {
                console.warn(
                  `Config mismatch for ${key} in ${env}, Remote: ${value}, Local: ${LiveConfig.getDefaultValueByKey(
                    key,
                  )?.toString()}`,
                );
              }
            }
          }
        }
        await deleteApp(firebaseApp);
      });
    };

    const fetchAndActivateConfig = async () => {
      try {
        await warnOnConfigMismatch();
      } catch (error) {
        // ignore the config check if any error occurs because it's not critical
      }
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
