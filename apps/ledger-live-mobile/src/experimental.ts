import { useState, useEffect } from "react";
import Config from "react-native-config";
import storage from "LLM/storage";
import { concatMap } from "rxjs/operators";
import { setEnvUnsafe, isEnvDefault, changes } from "@ledgerhq/live-env";
import type { EnvName } from "@ledgerhq/live-env";

import { FeatureId } from "@ledgerhq/types-live";

import logger from "./logger";

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

export type FeatureFloat = {
  type: "float";
  minValue?: number;
  maxValue?: number;
};

export type Feature = FeatureCommon & (FeatureToggle | FeatureInteger | FeatureFloat);

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
          title: i18nKey("experimentalIntegrations", "title"),
          description: i18nKey("experimentalIntegrations", "description"),
          valueOn: experimentalCurrencies,
          valueOff: "",
        },
      ]
    : []),
  {
    type: "toggle",
    name: "MANAGER_DEV_MODE",
    title: i18nKey("developerMode", "title"),
    description: i18nKey("developerMode", "description"),
  },
  {
    type: "integer",
    name: "FORCE_PROVIDER",
    title: i18nKey("managerProvider", "title"),
    description: i18nKey("managerProvider", "description"),
    minValue: 1,
  },
  {
    type: "toggle",
    name: "EXPERIMENTAL_EXPLORERS",
    title: i18nKey("experimentalExplorers", "title"),
    description: i18nKey("experimentalExplorers", "description"),
  },
  {
    type: "toggle",
    name: "EIP1559_MINIMUM_FEES_GATE",
    title: i18nKey("1559DeactivateGate", "title"),
    description: i18nKey("1559DeactivateGate", "description"),
    valueOn: false,
    valueOff: true,
  },
  {
    type: "integer",
    name: "EIP1559_PRIORITY_FEE_LOWER_GATE",
    title: i18nKey("1559CustomPriorityLowerGate", "title"),
    description: i18nKey("1559CustomPriorityLowerGate", "description"),
    minValue: 0,
    maxValue: 1,
  },
  {
    type: "float",
    name: "EIP1559_BASE_FEE_MULTIPLIER",
    title: i18nKey("1559CustomBaseFeeMultiplier", "title"),
    description: i18nKey("1559CustomBaseFeeMultiplier", "description"),
    minValue: 0,
    maxValue: 10,
  },
  {
    type: "toggle",
    name: "ENABLE_NETWORK_LOGS",
    title: i18nKey("experimentalEnableNetworkLogs", "title"),
    description: i18nKey("experimentalEnableNetworkLogs", "description"),
  },
  ...(__DEV__
    ? [
        {
          type: "toggle",
          name: "EXPERIMENTAL_SWAP",
          title: i18nKey("experimentalSwap", "title"),
          description: i18nKey("experimentalSwap", "description"),
        },
      ]
    : []),
] as Feature[];

export const developerFeatures: Feature[] = [
  {
    type: "toggle",
    name: "PLATFORM_DEBUG",
    title: i18nKeyDeveloper("debugApps", "title"),
    description: i18nKeyDeveloper("debugApps", "description"),
  },
  {
    type: "toggle",
    name: "PLATFORM_EXPERIMENTAL_APPS",
    title: i18nKeyDeveloper("experimentalApps", "title"),
    description: i18nKeyDeveloper("experimentalApps", "description"),
  },
  {
    type: "toggle",
    name: "USE_LEARN_STAGING_URL",
    title: i18nKeyDeveloper("staggingUrl", "title"),
    description: i18nKeyDeveloper("staggingUrl", "description"),
  },
  {
    type: "toggle",
    name: "MOCK_APP_UPDATE",
    title: i18nKeyDeveloper("mockAppUpdate", "title"),
    description: i18nKeyDeveloper("mockAppUpdate", "description"),
  },
];

const storageKey = "experimentalFlags";

export const getStorageEnv = async () => {
  try {
    const maybeData = await storage.get<Record<string, unknown>>(storageKey);
    if (!maybeData || Array.isArray(maybeData)) return {};
    return maybeData;
  } catch (error) {
    logger.critical(error as Error);
    return {};
  }
};

export const setStorageEnvs = async (key: EnvName, val: string) => {
  try {
    const envs = await getStorageEnv();
    envs[key] = val;
    await storage.save(storageKey, envs);
  } catch (error) {
    logger.critical(error as Error);
  }
};

export const isReadOnly = (key: EnvName) => key in Config;

export const enabledExperimentalFeatures = (): string[] =>
  [...experimentalFeatures, ...developerFeatures].map(e => e.name).filter(k => !isEnvDefault(k));

(async () => {
  const envs = await getStorageEnv();

  for (const k in envs) {
    setEnvUnsafe(k as EnvName, envs[k]);
  }

  for (const k in Config) {
    setEnvUnsafe(k as EnvName, Config[k]);
  }

  const saveEnvs = async (name: EnvName, value: string) => {
    if (
      [...experimentalFeatures, ...developerFeatures].find(f => f.name === name) &&
      !isReadOnly(name)
    ) {
      await setStorageEnvs(name, value);
    }
  };

  changes.pipe(concatMap(({ name, value }) => saveEnvs(name, value))).subscribe();
})();

export function useExperimental(): boolean {
  const [state, setState] = useState(() => enabledExperimentalFeatures().length > 0);

  useEffect(() => {
    const sub = changes.subscribe(() => {
      const newExperimental = enabledExperimentalFeatures().length > 0;
      setState(newExperimental);
    });

    return () => sub.unsubscribe();
  }, []);

  return state;
}
