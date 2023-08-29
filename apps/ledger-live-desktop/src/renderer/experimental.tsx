import React from "react";
import { isEnvDefault, changes, EnvName } from "@ledgerhq/live-env";
import { Trans } from "react-i18next";
import { setEnvOnAllThreads } from "./../helpers/env";
export type FeatureCommon = {
  name: EnvName;
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  shadow?: boolean;
  dirty?: boolean;
}; // NB Will trigger a clear cache if changed

export type FeatureToggle =
  | {
      type: "toggle";
      valueOn?: string | boolean;
      valueOff?: string | boolean;
    }
  | {
      type: "integer";
      minValue?: number;
      maxValue?: number;
    }
  | {
      type: "float";
      minValue?: number;
      maxValue?: number;
    };
export type Feature = FeatureCommon & FeatureToggle;

// comma-separated list of currencies that we want to enable as experimental, e.g:
// const experimentalCurrencies = "solana,cardano";
const experimentalCurrencies = "";
export const experimentalFeatures: Feature[] = [
  ...((experimentalCurrencies.length
    ? [
        {
          type: "toggle" as const,
          name: "EXPERIMENTAL_CURRENCIES",
          title: <Trans i18nKey="settings.experimental.features.experimentalCurrencies.title" />,
          description: (
            <Trans i18nKey="settings.experimental.features.experimentalCurrencies.description" />
          ),
          valueOn: experimentalCurrencies,
          valueOff: "",
        },
      ]
    : []) as Feature[]),
  {
    type: "toggle",
    name: "MANAGER_DEV_MODE",
    title: <Trans i18nKey="settings.experimental.features.managerDevMode.title" />,
    description: <Trans i18nKey="settings.experimental.features.managerDevMode.description" />,
  },
  {
    type: "toggle",
    name: "SCAN_FOR_INVALID_PATHS",
    title: <Trans i18nKey="settings.experimental.features.scanForInvalidPaths.title" />,
    description: <Trans i18nKey="settings.experimental.features.scanForInvalidPaths.description" />,
  },
  {
    type: "integer",
    name: "KEYCHAIN_OBSERVABLE_RANGE",
    title: <Trans i18nKey="settings.experimental.features.keychainObservableRange.title" />,
    description: (
      <Trans i18nKey="settings.experimental.features.keychainObservableRange.description" />
    ),
    minValue: 20,
    maxValue: 999,
    dirty: true,
  },
  {
    type: "integer",
    name: "FORCE_PROVIDER",
    title: <Trans i18nKey="settings.experimental.features.forceProvider.title" />,
    description: <Trans i18nKey="settings.experimental.features.forceProvider.description" />,
    minValue: 1,
  },
  {
    type: "toggle",
    name: "EIP1559_MINIMUM_FEES_GATE",
    title: <Trans i18nKey="settings.experimental.features.1559DeactivateGate.title" />,
    description: <Trans i18nKey="settings.experimental.features.1559DeactivateGate.description" />,
    valueOn: false,
    valueOff: true,
  },
  {
    type: "integer",
    name: "EIP1559_PRIORITY_FEE_LOWER_GATE",
    title: <Trans i18nKey="settings.experimental.features.1559CustomPriorityLowerGate.title" />,
    description: (
      <Trans i18nKey="settings.experimental.features.1559CustomPriorityLowerGate.description" />
    ),
    minValue: 0,
    maxValue: 1,
  },
  {
    type: "float",
    name: "EIP1559_BASE_FEE_MULTIPLIER",
    title: <Trans i18nKey="settings.experimental.features.1559CustomBaseFeeMultiplier.title" />,
    description: (
      <Trans i18nKey="settings.experimental.features.1559CustomBaseFeeMultiplier.description" />
    ),
    minValue: 0,
    maxValue: 10,
  },
  {
    type: "toggle",
    name: "ENABLE_NETWORK_LOGS",
    title: <Trans i18nKey="settings.experimental.features.enableNetworkLogs.title" />,
    description: <Trans i18nKey="settings.experimental.features.enableNetworkLogs.description" />,
  },
];
const lsKey = "experimentalFlags";
const lsKeyVersion = `${lsKey}_llversion`;
export const getLocalStorageEnvs = (): {
  [_: string]: unknown;
} => {
  const maybeData = window.localStorage.getItem(lsKey);
  if (!maybeData) return {};
  const obj = JSON.parse(maybeData);
  if (typeof obj !== "object" || !obj) return {};
  Object.keys(obj).forEach(k => {
    if (!experimentalFeatures.find(f => f.name === k)) {
      delete obj[k];
    }
  });
  return obj;
};
export const enabledExperimentalFeatures = (): string[] =>
  experimentalFeatures.map(e => e.name).filter(k => !isEnvDefault(k));
export const isReadOnlyEnv = (key: EnvName) => key in process.env;
export const setLocalStorageEnv = (key: EnvName, val: string) => {
  const envs = getLocalStorageEnvs();
  envs[key] = val;
  window.localStorage.setItem(lsKey, JSON.stringify(envs));
};
if (window.localStorage.getItem(lsKeyVersion) !== __APP_VERSION__) {
  const existing = getLocalStorageEnvs();
  // we replace all existing ones by clearing those who are gone
  const restoredEnvs: Record<string, unknown> = {};
  experimentalFeatures
    .filter(e => !e.shadow && e.name in existing && setEnvOnAllThreads(e.name, existing[e.name]))
    .forEach(e => {
      restoredEnvs[e.name] = existing[e.name];
    });
  window.localStorage.setItem(lsKey, JSON.stringify(restoredEnvs));
  window.localStorage.setItem(lsKeyVersion, __APP_VERSION__);
}
const envs = getLocalStorageEnvs();
/* eslint-disable guard-for-in */
for (const k in envs) {
  setEnvOnAllThreads(k, envs[k]);
}
for (const k in process.env) {
  setEnvOnAllThreads(k, process.env[k]);
}
/* eslint-enable guard-for-in */

let lastChange = 0;
export function recentlyChangedExperimental() {
  return Date.now() - lastChange < 10000;
}
changes.subscribe(({ name, value }) => {
  if (experimentalFeatures.find(f => f.name === name) && !isReadOnlyEnv(name)) {
    lastChange = Date.now();
    setLocalStorageEnv(name, value);
  }
});
