import { useState, useEffect } from "react";
import Config from "react-native-config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { concatMap } from "rxjs/operators";
import {
  setEnvUnsafe,
  isEnvDefault,
  changes,
} from "@ledgerhq/live-common/env";
import type { EnvName } from "@ledgerhq/live-common/env";

import logger from "./logger";
import { FeatureId } from "@ledgerhq/live-common/types/index";

export type FeatureCommon = {
  name: EnvName,
  title: string,
  description: string,
  shadow?: boolean,
  rolloutFeatureFlag?: FeatureId,
};

export type FeatureToggle = {
  type: "toggle",
  valueOn?: any,
  valueOff?: any,
};

export type FeatureInteger = {
  type: "integer",
  minValue?: number,
  maxValue?: number,
};

export type Feature = FeatureCommon & (FeatureToggle | FeatureInteger);

// comma-separated list of currencies that we want to enable as experimental, e.g:
// const experimentalCurrencies = "solana,cardano";
const experimentalCurrencies = "";


export const experimentalFeatures: Feature[] = [
  ...(experimentalCurrencies.length
    ? [
        {
          type: "toggle",
          name: "EXPERIMENTAL_CURRENCIES",
          title: "Experimental integrations",
          description: "Use available experimental crypto assets integrations.",
          valueOn: experimentalCurrencies,
          valueOff: "",
        },
      ]
    : []),
  {
    type: "toggle",
    name: "MANAGER_DEV_MODE",
    title: "Developer mode",
    description: "Show developer and testnet apps in the Manager.",
  },
  {
    type: "integer",
    name: "FORCE_PROVIDER",
    title: "Manager provider",
    description:
      "Changing the app provider in the Manager may make it impossible to install or uninstall apps on your Ledger device.",
    minValue: 1,
  },
  {
    type: "toggle",
    name: "EXPERIMENTAL_EXPLORERS",
    title: "Experimental Explorers API",
    description:
      "Try an upcoming version of Ledger's blockchain explorers. Changing this setting may affect the account balance and synchronization as well as the send feature.",
  },
  {
    type: "toggle",
    name: "LEDGER_COUNTERVALUES_API",
    title: "Experimental countervalues API",
    description:
      "This may cause the countervalues displayed for your accounts to become incorrect.",
    valueOn: "https://countervalues-experimental.live.ledger.com",
    valueOff: "https://countervalues.live.ledger.com",
  },
  ...(__DEV__
    ? [
        {
          type: "toggle",
          name: "EXPERIMENTAL_SWAP",
          title: "New SWAP interface ",
          description: "Use the new experimental swap interface",
        },
      ]
    : []),
] as Feature[];

export const developerFeatures: Feature[] = [
  {
    type: "toggle",
    name: "PLATFORM_EXPERIMENTAL_APPS",
    title: "Allow experimental apps",
    description: "Display and allow opening experimental tagged platform apps.",
  },
  {
    type: "toggle",
    name: "USE_LEARN_STAGING_URL",
    title: "Learn staging URL",
    description: "Use the staging URL for the Learn page.",
  },
];

const storageKey = "experimentalFlags";

export const getStorageEnv = async () => {
  try {
    const maybeData = await AsyncStorage.getItem(storageKey);
    return maybeData ? JSON.parse(maybeData) : {};
  } catch (error) {
    logger.critical(error as Error);
    return {};
  }
};

export const setStorageEnvs = async (key: EnvName, val: string) => {
  try {
    const envs = await getStorageEnv();
    envs[key] = val;
    await AsyncStorage.setItem(storageKey, JSON.stringify(envs));
  } catch (error) {
    logger.critical(error as Error);
  }
};

export const isReadOnly = (key: EnvName) => key in Config;

export const enabledExperimentalFeatures = (): string[] =>
  // $FlowFixMe
  [...experimentalFeatures, ...developerFeatures]
    .map(e => e.name)
    .filter(k => !isEnvDefault(k));

(async () => {
  const envs = await getStorageEnv();

  /* eslint-disable guard-for-in */
  for (const k in envs) {
    setEnvUnsafe(k as EnvName, envs[k]);
  }

  for (const k in Config) {
    setEnvUnsafe(k as EnvName, Config[k]);
  }
  /* eslint-enable guard-for-in */

  const saveEnvs = async (name: EnvName, value: string) => {
    if (
      [...experimentalFeatures, ...developerFeatures].find(
        f => f.name === name,
      ) &&
      !isReadOnly(name)
    ) {
      await setStorageEnvs(name, value);
    }
  };

  changes
    .pipe(concatMap(({ name, value }) => saveEnvs(name, value)))
    .subscribe();
})();

export function useExperimental(): boolean {
  const [state, setState] = useState(
    () => enabledExperimentalFeatures().length > 0,
  );

  useEffect(() => {
    const sub = changes.subscribe(() => {
      const newExperimental = enabledExperimentalFeatures().length > 0;
      setState(newExperimental);
    });

    return () => sub.unsubscribe();
  }, []);

  return state;
}

