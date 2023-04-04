import { useState, useEffect } from "react";
import Config from "react-native-config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { concatMap } from "rxjs/operators";
import { setEnvUnsafe, isEnvDefault, changes } from "@ledgerhq/live-common/env";
import type { EnvName } from "@ledgerhq/live-common/env";

import { FeatureId } from "@ledgerhq/types-live";

import logger from "./logger";
import { i18n } from "./context/Locale";

export type FeatureCommon = {
  name: EnvName;
  title: string;
  description: string;
  shadow?: boolean;
  rolloutFeatureFlag?: FeatureId;
};

export type FeatureToggle = {
  type: "toggle";
  valueOn?: unknown;
  valueOff?: unknown;
};

export type FeatureInteger = {
  type: "integer";
  minValue?: number;
  maxValue?: number;
};

export type Feature = FeatureCommon & (FeatureToggle | FeatureInteger);

// comma-separated list of currencies that we want to enable as experimental, e.g:
// const experimentalCurrencies = "solana,cardano";
const experimentalCurrencies = "";

const i18nKey = (key: string, prop: string) =>
  `settings.experimental.experimentalFeatures.${key}.${prop}`;

const i18nKeyDeveloper = (key: string, prop: string) =>
  `settings.experimental.developerFeatures.${key}.${prop}`;

export const experimentalFeatures: Feature[] = [
  ...(experimentalCurrencies.length
    ? [
        {
          type: "toggle",
          name: "EXPERIMENTAL_CURRENCIES",
          title: i18n.t(i18nKey("experimentalIntegrations", "title")),
          description: i18n.t(
            i18nKey("experimentalIntegrations", "description"),
          ),
          valueOn: experimentalCurrencies,
          valueOff: "",
        },
      ]
    : []),
  {
    type: "toggle",
    name: "MANAGER_DEV_MODE",
    title: i18n.t(i18nKey("developerMode", "title")),
    description: i18n.t(i18nKey("developerMode", "description")),
  },
  {
    type: "integer",
    name: "FORCE_PROVIDER",
    title: i18n.t(i18nKey("managerProvider", "title")),
    description: i18n.t(i18nKey("managerProvider", "description")),
    minValue: 1,
  },
  {
    type: "toggle",
    name: "EXPERIMENTAL_EXPLORERS",
    title: i18n.t(i18nKey("experimentalExplorers", "title")),
    description: i18n.t(i18nKey("experimentalExplorers", "description")),
  },
  {
    type: "toggle",
    name: "LEDGER_COUNTERVALUES_API",
    title: i18n.t(i18nKey("experimentalCountervalues", "title")),
    description: i18n.t(i18nKey("experimentalCountervalues", "description")),
    valueOn: "https://countervalues-experimental.live.ledger.com",
    valueOff: "https://countervalues.live.ledger.com",
  },
  {
    type: "toggle",
    name: "EIP1559_MINIMUM_FEES_GATE",
    title: "Deactivate EIP-1559 minimum priority fee gate",
    description:
      "This will allow a transaction to be sent without any minimum priority fee expected. This may result in a transaction getting stuck in the mempool forever.",
    valueOn: false,
    valueOff: true,
  },
  {
    type: "integer",
    name: "EIP1559_PRIORITY_FEE_LOWER_GATE",
    title: "Custom priority fee gate",
    description:
      "Customize the percentage of our estimated minimal priority fee allowed for an advanced EIP1559 transaction",
    minValue: 0,
    maxValue: 1,
  },
  ...(__DEV__
    ? [
        {
          type: "toggle",
          name: "EXPERIMENTAL_SWAP",
          title: i18n.t(i18nKey("experimentalSwap", "title")),
          description: i18n.t(i18nKey("experimentalSwap", "description")),
        },
      ]
    : []),
] as Feature[];

export const developerFeatures: Feature[] = [
  {
    type: "toggle",
    name: "PLATFORM_DEBUG",
    title: i18n.t(i18nKeyDeveloper("debugApps", "title")),
    description: i18n.t(i18nKeyDeveloper("debugApps", "description")),
  },
  {
    type: "toggle",
    name: "PLATFORM_EXPERIMENTAL_APPS",
    title: i18n.t(i18nKeyDeveloper("experimentalApps", "title")),
    description: i18n.t(i18nKeyDeveloper("experimentalApps", "description")),
  },
  {
    type: "toggle",
    name: "USE_LEARN_STAGING_URL",
    title: i18n.t(i18nKeyDeveloper("staggingUrl", "title")),
    description: i18n.t(i18nKeyDeveloper("staggingUrl", "description")),
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
