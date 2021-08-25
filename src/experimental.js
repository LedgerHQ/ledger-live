// @flow
import Config from "react-native-config";
import AsyncStorage from "@react-native-community/async-storage";
import { concatMap } from "rxjs/operators";
import {
  setEnvUnsafe,
  isEnvDefault,
  changes,
} from "@ledgerhq/live-common/lib/env";
import type { EnvName } from "@ledgerhq/live-common/lib/env";

import logger from "./logger";

export type FeatureCommon = {
  name: EnvName,
  title: string,
  description: string,
  shadow?: boolean,
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

export const experimentalFeatures: Feature[] = [
  {
    type: "toggle",
    name: "EXPERIMENTAL_CURRENCIES_JS_BRIDGE",
    title: "Tezos JS impl",
    description: "Tezos JS impl",
    valueOn: "tezos",
    valueOff: "",
  },
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
];

const storageKey = "experimentalFlags";

export const getStorageEnv = async () => {
  try {
    const maybeData = await AsyncStorage.getItem(storageKey);
    return maybeData ? JSON.parse(maybeData) : {};
  } catch (error) {
    logger.critical(error);
    return {};
  }
};

export const setStorageEnvs = async (key: EnvName, val: string) => {
  try {
    const envs = await getStorageEnv();
    envs[key] = val;
    await AsyncStorage.setItem(storageKey, JSON.stringify(envs));
  } catch (error) {
    logger.critical(error);
  }
};

export const isReadOnly = (key: EnvName) => key in Config;

export const enabledExperimentalFeatures = (): string[] =>
  // $FlowFixMe
  experimentalFeatures.map(e => e.name).filter(k => !isEnvDefault(k));

(async () => {
  const envs = await getStorageEnv();

  /* eslint-disable guard-for-in */
  for (const k in envs) {
    setEnvUnsafe(k, envs[k]);
  }

  for (const k in Config) {
    setEnvUnsafe(k, Config[k]);
  }
  /* eslint-enable guard-for-in */

  const saveEnvs = async (name, value) => {
    if (experimentalFeatures.find(f => f.name === name) && !isReadOnly(name)) {
      await setStorageEnvs(name, value);
    }
  };

  changes
    .pipe(concatMap(({ name, value }) => saveEnvs(name, value)))
    .subscribe();
})();
