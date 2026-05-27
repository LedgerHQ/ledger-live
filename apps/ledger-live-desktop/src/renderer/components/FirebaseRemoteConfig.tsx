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
import { getFirebaseConfig } from "~/firebase-setup";
import {
  getRemoteConfigSingleton,
  subscribeToRemoteFlags,
  whenReady,
} from "~/firebase/remoteConfig";
import isMatch from "lodash/isMatch";
import * as fs from "fs";

export const FirebaseRemoteConfigContext = React.createContext<{
  config: RemoteConfig | null;
  lastFetchTime: number;
}>({ config: null, lastFetchTime: 0 });

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

// Spins up a parallel Firebase app per env, fetches its remote config, and
// warns when remote `config_*` values diverge from the local defaults declared
// via LiveConfig. Dev-only — runs alongside the main provider but does not
// interact with the singleton owned by `~/firebase/remoteConfig`.
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
    } catch {
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

export const FirebaseRemoteConfigProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element | null => {
  const [config, setConfig] = useState<RemoteConfig | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  useEffect(() => {
    let remoteConfig: RemoteConfig;
    try {
      remoteConfig = getRemoteConfigSingleton();
    } catch (error) {
      console.error(`Failed to initialize Firebase SDK with error: ${error}`);
      setLoaded(true);
      return;
    }
    setConfig(remoteConfig);

    LiveConfig.setProvider(
      new FirebaseProvider({
        getValue: (key: string) => {
          return getValue(remoteConfig, key);
        },
      }),
    );

    // Bump lastFetchTime on every successful middleware-driven fetch so Context
    // consumers re-render in lockstep with the Redux slice. Replay semantics in
    // subscribeToRemoteFlags ensure we receive the boot-time fetch even when
    // the middleware completes it before this effect runs.
    const unsubscribe = subscribeToRemoteFlags(({ fetchedAt }) => {
      setLastFetchTime(fetchedAt);
    });

    // Release the boot gate as soon as the first fetch resolves (success or
    // failure), matching the legacy provider's `finally`-based behavior.
    let cancelled = false;
    whenReady().then(() => {
      if (!cancelled) setLoaded(true);
    });

    warnOnConfigMismatch().catch(() => {
      // The dev-only config check is best-effort.
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <FirebaseRemoteConfigContext.Provider value={{ config, lastFetchTime }}>
      {children}
    </FirebaseRemoteConfigContext.Provider>
  );
};
