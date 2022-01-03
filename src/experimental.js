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
    title: "Experimental JS impl",
    description:
      "Use experimental JS implementations for Bitcoin, all Bitcoin forks, and Tezos.",
    valueOn:
      "bitcoin,bitcoin_testnet,tezos,bitcoin_cash,litecoin,dash,qtum,zcash,bitcoin_gold,stratis,dogecoin,digibyte,komodo,pivx,zencash,vertcoin,peercoin,viacoin,stakenet,stealthcoin,decred",
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
  {
    type: "toggle",
    name: "LEDGER_COUNTERVALUES_API",
    title: "Experimental countervalues API",
    description:
      "This may cause the countervalues displayed for your accounts to become incorrect.",
    valueOn: "https://countervalues.live.ledger.com",
    valueOff: "https://countervalues-experimental.live.ledger.com",
  },
  {
    type: "toggle",
    name: "NFT",
    title: "NFT management features",
    description:
      "Display your Ethereum NFT and their metadata in your accounts. Send Ethereum NFT directly from Ledger Live.",
    valueOn: true,
    valueOff: false,
  },
  {
    type: "toggle",
    name: "NFT_ETH_METADATA_SERVICE",
    title: "NFT staging metadata service",
    description: "Use staging metadata service instead of production.",
    valueOn: "https://nft.api.live.ledger-stg.com",
    valueOff: "https://nft.api.live.ledger.com",
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

export const developerFeatures: Feature[] = [
  {
    type: "toggle",
    name: "PLATFORM_EXPERIMENTAL_APPS",
    title: "Allow experimental apps",
    description: "Display and allow opening experimental tagged platform apps.",
  },
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
  [...experimentalFeatures, ...developerFeatures]
    .map(e => e.name)
    .filter(k => !isEnvDefault(k));

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
