// @flow
// set and get environment & config variables

type ExtractEnvValue = <V>((string) => ?V) => V;

type Env = typeof envParsers;
export type EnvName = $Keys<Env>;

const intParser = (v: string): ?number => {
  if (!isNaN(v)) return parseInt(v, 10);
};

const floatParser = (v: string): ?number => {
  if (!isNaN(v)) return parseFloat(v);
};

const boolParser = (v: string): ?boolean => {
  return !(v === "0" || v === "false");
};

const stringParser = (v: string): ?string => v;

// For each
const envParsers = {
  MANAGER_DEV_MODE: boolParser,
  SHOW_LEGACY_NEW_ACCOUNT: boolParser,
  WITH_DEVICE_POLLING_DELAY: floatParser,
  FORCE_PROVIDER: intParser,
  LEDGER_REST_API_BASE: stringParser,
  MANAGER_API_BASE: stringParser,
  BASE_SOCKET_URL: stringParser,
  EXPLORER_V2: stringParser,
  EXPLORER_V3: stringParser,
  EXPERIMENTAL_EXPLORERS: boolParser
};

// initialized with default values
const env: $ObjMap<Env, ExtractEnvValue> = {
  MANAGER_DEV_MODE: false,
  SHOW_LEGACY_NEW_ACCOUNT: false,
  WITH_DEVICE_POLLING_DELAY: 500,
  FORCE_PROVIDER: 0, // in zero case, we will not force provider. otherwise you can force one.
  LEDGER_REST_API_BASE: "https://explorers.api.live.ledger.com",
  MANAGER_API_BASE: "https://manager.api.live.ledger.com/api",
  BASE_SOCKET_URL: "wss://api.ledgerwallet.com/update",
  EXPLORER_V2:
    "https://explorers.api.live.ledger.com/blockchain/v2/$ledgerExplorerId",
  EXPLORER_V3:
    "http://$ledgerExplorerId.explorers.prod.aws.ledger.fr/blockchain/v3",
  EXPERIMENTAL_EXPLORERS: false
};

export type EnvValue<Name> = $ElementType<typeof env, Name>;

// implementation can override the defaults typically at boot of the app but potentially over time
export const setEnv = <Name: EnvName>(name: Name, value: EnvValue<Name>) => {
  // $FlowFixMe flow don't seem to type proof it
  env[name] = value;
};

// Usage: you must use getEnv at runtime because the env might be settled over time. typically will allow us to dynamically change them on the interface (e.g. some sort of experimental flags system)
export const getEnv = <Name: EnvName>(name: Name): EnvValue<Name> => {
  // $FlowFixMe flow don't seem to type proof it
  return env[name];
};

export const setEnvUnsafe = <Name: EnvName>(
  name: Name,
  unsafeValue: string
): boolean => {
  const parser = envParsers[name];
  if (!parser) return false;
  const value = parser(unsafeValue);
  if (value === undefined || value === null) {
    console.warn(`Invalid ENV value for ${name}`);
    return false;
  }
  // $FlowFixMe
  setEnv(name, value);
  return true;
};
