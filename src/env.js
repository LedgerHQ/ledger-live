// @flow
// set and get environment & config variables
import { Subject } from "rxjs";

const intParser = (v: mixed): ?number => {
  if (!Number.isNaN(v)) return parseInt(v, 10);
};

const floatParser = (v: mixed): ?number => {
  if (!Number.isNaN(v)) return parseFloat(v);
};

const boolParser = (v: mixed): ?boolean => {
  if (typeof v === "boolean") return v;
  return !(v === "0" || v === "false");
};

const stringParser = (v: mixed): ?string =>
  typeof v === "string" ? v : undefined;

// This define the available environments
const envParsers = {
  API_TEZOS_BAKER: stringParser,
  API_TEZOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT: stringParser,
  API_TEZOS_NODE: stringParser,
  BASE_SOCKET_URL: stringParser,
  BRIDGE_FORCE_IMPLEMENTATION: stringParser,
  DEVICE_PROXY_URL: stringParser,
  DISABLE_TRANSACTION_BROADCAST: boolParser,
  EXPERIMENTAL_BLE: boolParser,
  EXPERIMENTAL_CURRENCIES: stringParser,
  EXPERIMENTAL_EXPLORERS: boolParser,
  EXPERIMENTAL_FALLBACK_APDU_LISTAPPS: boolParser,
  EXPERIMENTAL_LANGUAGES: boolParser,
  EXPERIMENTAL_LIBCORE: boolParser,
  EXPERIMENTAL_MANAGER: boolParser,
  EXPERIMENTAL_ROI_CALCULATION: boolParser,
  EXPERIMENTAL_SEND_MAX: boolParser,
  EXPERIMENTAL_USB: boolParser,
  EXPLORER: stringParser,
  FORCE_PROVIDER: intParser,
  HIDE_EMPTY_TOKEN_ACCOUNTS: boolParser,
  KEYCHAIN_OBSERVABLE_RANGE: intParser,
  LEDGER_COUNTERVALUES_API: stringParser,
  LEDGER_REST_API_BASE: stringParser,
  LEGACY_KT_SUPPORT_TO_YOUR_OWN_RISK: boolParser,
  LIBCORE_PASSWORD: stringParser,
  MANAGER_API_BASE: stringParser,
  MANAGER_DEV_MODE: boolParser,
  MANAGER_INSTALL_DELAY: intParser,
  MOCK: boolParser,
  OPERATION_OPTIMISTIC_RETENTION: intParser,
  SCAN_FOR_INVALID_PATHS: boolParser,
  SHOW_LEGACY_NEW_ACCOUNT: boolParser,
  SYNC_MAX_CONCURRENT: intParser,
  USER_ID: stringParser,
  WITH_DEVICE_POLLING_DELAY: floatParser
};

// This define the default values
const defaults: $ObjMap<EnvParsers, ExtractEnvValue> = {
  API_TEZOS_BAKER: "https://tezos-bakers.api.live.ledger.com",
  API_TEZOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT:
    "https://xtz-explorer.api.live.ledger.com/explorer",
  API_TEZOS_NODE: "https://xtz-node.api.live.ledger.com",
  BASE_SOCKET_URL: "wss://api.ledgerwallet.com/update",
  BRIDGE_FORCE_IMPLEMENTATION: "",
  DEVICE_PROXY_URL: "",
  DISABLE_TRANSACTION_BROADCAST: false,
  EXPERIMENTAL_BLE: false,
  EXPERIMENTAL_CURRENCIES: "",
  EXPERIMENTAL_EXPLORERS: false,
  EXPERIMENTAL_FALLBACK_APDU_LISTAPPS: false,
  EXPERIMENTAL_LANGUAGES: false,
  EXPERIMENTAL_LIBCORE: false,
  EXPERIMENTAL_ROI_CALCULATION: false,
  EXPERIMENTAL_MANAGER: false,
  EXPERIMENTAL_SEND_MAX: false,
  EXPERIMENTAL_USB: false,
  EXPLORER: "https://explorers.api.live.ledger.com",
  FORCE_PROVIDER: 1,
  HIDE_EMPTY_TOKEN_ACCOUNTS: false,
  KEYCHAIN_OBSERVABLE_RANGE: 0,
  LEDGER_COUNTERVALUES_API: "https://countervalues.api.live.ledger.com",
  LEDGER_REST_API_BASE: "https://explorers.api.live.ledger.com",
  LEGACY_KT_SUPPORT_TO_YOUR_OWN_RISK: false,
  LIBCORE_PASSWORD: "",
  MANAGER_API_BASE: "https://manager.api.live.ledger.com/api",
  MANAGER_DEV_MODE: false,
  MANAGER_INSTALL_DELAY: 1000,
  MOCK: false,
  OPERATION_OPTIMISTIC_RETENTION: 30 * 60 * 1000,
  SCAN_FOR_INVALID_PATHS: false,
  SHOW_LEGACY_NEW_ACCOUNT: false,
  SYNC_MAX_CONCURRENT: 4,
  USER_ID: "",
  WITH_DEVICE_POLLING_DELAY: 500
};

// private local state
const env: $ObjMap<EnvParsers, ExtractEnvValue> = {
  ...defaults
};

export const getAllEnvNames = (): EnvName[] => Object.keys(env);

export const getAllEnvs = (): Env => ({ ...env });

// Usage: you must use getEnv at runtime because the env might be settled over time. typically will allow us to dynamically change them on the interface (e.g. some sort of experimental flags system)
export const getEnv = <Name: EnvName>(name: Name): EnvValue<Name> =>
  // $FlowFixMe flow don't seem to type proof it
  env[name];

export const getEnvDefault = <Name: EnvName>(name: Name): EnvValue<Name> =>
  // $FlowFixMe flow don't seem to type proof it
  defaults[name];

export const isEnvDefault = <Name: EnvName>(name: Name): EnvValue<Name> =>
  // $FlowFixMe flow don't seem to type proof it
  env[name] === defaults[name];

export const changes: Subject<{
  name: EnvName,
  value: EnvValue<*>,
  oldValue: EnvValue<*>
}> = new Subject();

// change one environment
export const setEnv = <Name: EnvName>(name: Name, value: EnvValue<Name>) => {
  const oldValue = env[name];
  if (oldValue !== value) {
    // $FlowFixMe flow don't seem to type proof it
    env[name] = value;
    // $FlowFixMe
    changes.next({ name, value, oldValue });
  }
};

// change one environment with safety. returns true if it succeed
export const setEnvUnsafe = (name: string, unsafeValue: mixed): boolean => {
  if (!(name in envParsers)) return false;
  const parser = envParsers[name];
  const value = parser(unsafeValue);
  if (value === undefined || value === null) {
    console.warn(`Invalid ENV value for ${name}`);
    return false;
  }
  // $FlowFixMe flow don't seem to type proof it
  setEnv(name, value);
  return true;
};

type ExtractEnvValue = <V>((mixed) => ?V) => V;
type EnvParsers = typeof envParsers;
type Env = typeof env;
export type EnvValue<Name> = $ElementType<Env, Name>;
export type EnvName = $Keys<EnvParsers>;
