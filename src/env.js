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
  MANAGER_DEV_MODE: boolParser,
  SCAN_FOR_INVALID_PATHS: boolParser,
  EXPERIMENTAL_NATIVE_SEGWIT: boolParser,
  SHOW_LEGACY_NEW_ACCOUNT: boolParser,
  WITH_DEVICE_POLLING_DELAY: floatParser,
  FORCE_PROVIDER: intParser,
  LEDGER_REST_API_BASE: stringParser,
  MANAGER_API_BASE: stringParser,
  BASE_SOCKET_URL: stringParser,
  EXPLORER_V2: stringParser,
  EXPLORER_V3: stringParser,
  EXPERIMENTAL_EXPLORERS: boolParser,
  EXPERIMENTAL_USB: boolParser,
  SYNC_MAX_CONCURRENT: intParser,
  MOCK: boolParser,
  LEDGER_DEBUG_ALL_LANGS: boolParser,
  LIBCORE_PASSWORD: stringParser,
  DISABLE_TRANSACTION_BROADCAST: boolParser
};

// This define the default values
const defaults: $ObjMap<EnvParsers, ExtractEnvValue> = {
  MANAGER_DEV_MODE: false,
  SCAN_FOR_INVALID_PATHS: false,
  EXPERIMENTAL_NATIVE_SEGWIT: false,
  SHOW_LEGACY_NEW_ACCOUNT: false,
  WITH_DEVICE_POLLING_DELAY: 500,
  FORCE_PROVIDER: 1,
  LEDGER_REST_API_BASE: "https://explorers.api.live.ledger.com",
  MANAGER_API_BASE: "https://manager.api.live.ledger.com/api",
  BASE_SOCKET_URL: "wss://api.ledgerwallet.com/update",
  EXPLORER_V2:
    "https://explorers.api.live.ledger.com/blockchain/v2/$ledgerExplorerId",
  EXPLORER_V3:
    "http://$ledgerExplorerId.explorers.prod.aws.ledger.fr/blockchain/v3",
  EXPERIMENTAL_EXPLORERS: false,
  EXPERIMENTAL_USB: false,
  SYNC_MAX_CONCURRENT: 4,
  MOCK: false,
  LEDGER_DEBUG_ALL_LANGS: false,
  LIBCORE_PASSWORD: "",
  DISABLE_TRANSACTION_BROADCAST: false
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
