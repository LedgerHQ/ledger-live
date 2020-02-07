// @flow
// set and get environment & config variables
import { Subject } from "rxjs";
import mapValues from "lodash/mapValues";

type EnvDef<V> = {
  desc: string,
  def: V,
  parser: mixed => ?V
};

type ExtractEnvValue = <V>(EnvDef<V>) => V;
type EnvDefs = typeof envDefinitions;
type Env = typeof env;
export type EnvValue<Name> = $ElementType<Env, Name>;
export type EnvName = $Keys<EnvDefs>;

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

const envDefinitions = {
  API_TEZOS_BAKER: {
    parser: stringParser,
    def: "https://tezos-bakers.api.live.ledger.com",
    desc: "bakers API for tezos"
  },
  API_TEZOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT: {
    def: "https://xtz-explorer.api.live.ledger.com/explorer",
    parser: stringParser,
    desc: "Ledger explorer API for tezos"
  },
  API_TEZOS_NODE: {
    def: "https://xtz-node.api.live.ledger.com",
    parser: stringParser,
    desc: "node API for tezos (for broadcast only)"
  },
  BASE_SOCKET_URL: {
    def: "wss://scriptrunner.api.live.ledger.com/update",
    parser: stringParser,
    desc: "Ledger script runner API"
  },
  BRIDGE_FORCE_IMPLEMENTATION: {
    def: "",
    parser: stringParser,
    desc:
      "force implementation for ALL currency bridges (affects scanning accounts)"
  },
  DEVICE_CANCEL_APDU_FLUSH_MECHANISM: {
    def: true,
    parser: boolParser,
    desc:
      "enable a mechanism that send a 0x00 apdu to force device to awake from its 'Processing' UI state"
  },
  DEVICE_PROXY_URL: {
    def: "",
    parser: stringParser,
    desc: "enable a proxy to use instead of a physical device"
  },
  DISABLE_TRANSACTION_BROADCAST: {
    def: false,
    parser: boolParser,
    desc: "disable broadcast of transactions"
  },
  EXPERIMENTAL_BLE: {
    def: false,
    parser: boolParser,
    desc: "enable experimental support of Bluetooth"
  },
  EXPERIMENTAL_CURRENCIES: {
    def: "",
    parser: stringParser,
    desc: "enable experimental support of currencies (comma separated)"
  },
  EXPERIMENTAL_EXPLORERS: {
    def: false,
    parser: boolParser,
    desc: "enable experimental explorer APIs"
  },
  EXPERIMENTAL_FALLBACK_APDU_LISTAPPS: {
    def: false,
    parser: boolParser,
    desc: "if HSM list apps fails, fallback on APDU version (>=1.6.0)"
  },
  EXPERIMENTAL_LANGUAGES: {
    def: false,
    parser: boolParser,
    desc: "enable experimental languages"
  },
  EXPERIMENTAL_LIBCORE: {
    def: false,
    parser: boolParser,
    desc:
      "enable experimental libcore implementation of a currency (affects scan accounts)"
  },
  EXPERIMENTAL_MANAGER: {
    def: false,
    parser: boolParser,
    desc: "enable an experimental version of Manager"
  },
  EXPERIMENTAL_PORTFOLIO_RANGE: {
    def: false,
    parser: boolParser,
    desc:
      "enable an experimental version of available graph ranges and granularity"
  },
  EXPERIMENTAL_ROI_CALCULATION: {
    def: false,
    parser: boolParser,
    desc:
      "enable an experimental version of the portfolio percentage calculation"
  },
  EXPERIMENTAL_SEND_MAX: {
    def: false,
    parser: boolParser,
    desc: "force enabling SEND MAX even if not yet stable"
  },
  EXPERIMENTAL_USB: {
    def: false,
    parser: boolParser,
    desc: "enable an experimental implementation of USB support"
  },
  EXPLORER: {
    def: "https://explorers.api.live.ledger.com",
    parser: stringParser,
    desc: "Ledger main explorer API (multi currencies)"
  },
  FORCE_PROVIDER: {
    def: 1,
    parser: intParser,
    desc: "use a different provider for app store (for developers only)"
  },
  GET_CALLS_RETRY: {
    def: 2,
    parser: intParser,
    desc: "how many times to retry a GET http call"
  },
  GET_CALLS_TIMEOUT: {
    def: 60 * 1000,
    parser: intParser,
    desc: "how much time to timeout a GET http call"
  },
  HIDE_EMPTY_TOKEN_ACCOUNTS: {
    def: false,
    parser: boolParser,
    desc: "hide the sub accounts when they are empty"
  },
  KEYCHAIN_OBSERVABLE_RANGE: {
    def: 0,
    parser: intParser,
    desc: "overrides the gap limit specified by BIP44 (default to 20)"
  },
  LEDGER_COUNTERVALUES_API: {
    def: "https://countervalues.api.live.ledger.com",
    parser: stringParser,
    desc: "Ledger countervalues API"
  },
  LEDGER_REST_API_BASE: {
    def: "https://explorers.api.live.ledger.com",
    parser: stringParser,
    desc: "DEPRECATED"
  },
  LEGACY_KT_SUPPORT_TO_YOUR_OWN_RISK: {
    def: false,
    parser: boolParser,
    desc: "enable sending to KT accounts. Not tested."
  },
  LIBCORE_BALANCE_HISTORY_NOGO: {
    def: "ripple,ethereum,tezos", // LLC-475
    parser: stringParser,
    desc:
      "comma-separated list of currencies which does not properly support balance history libcore implementation"
  },
  LIBCORE_PASSWORD: {
    def: "",
    parser: stringParser,
    desc: "libcore encryption password"
  },
  MANAGER_API_BASE: {
    def: "https://manager.api.live.ledger.com/api",
    parser: stringParser,
    desc: "Ledger Manager API"
  },
  MANAGER_DEV_MODE: {
    def: false,
    parser: boolParser,
    desc: "enable visibility of utility apps in Manager"
  },
  MANAGER_INSTALL_DELAY: {
    def: 1000,
    parser: intParser,
    desc:
      "defines the time to wait before installing apps to prevent known glitch (<=1.5.5) when chaining installs"
  },
  MAX_ACCOUNT_NAME_SIZE: {
    def: 50,
    parser: intParser,
    desc: "maximum size of account names"
  },
  MOCK: {
    def: false,
    parser: boolParser,
    desc: "switch the app into a MOCK mode for test purpose"
  },
  OPERATION_ADDRESSES_LIMIT: {
    def: 100,
    parser: intParser,
    desc: "limit the number of addresses in from/to of operations"
  },
  OPERATION_OPTIMISTIC_RETENTION: {
    def: 30 * 60 * 1000,
    parser: intParser,
    desc:
      "timeout to keep an optimistic operation that was broadcasted but not yet visible from libcore or the API"
  },
  OPERATION_PAGE_SIZE_INITIAL: {
    def: 100,
    parser: intParser,
    desc: "defines the initial default operation length page to use"
  },
  SCAN_FOR_INVALID_PATHS: {
    def: false,
    parser: boolParser,
    desc: "enable searching accounts in exotic derivation paths"
  },
  SHOW_LEGACY_NEW_ACCOUNT: {
    def: false,
    parser: boolParser,
    desc: "allow the creation of legacy accounts"
  },
  SKIP_ONBOARDING: {
    def: false,
    parser: boolParser,
    desc: "dev flag to skip onboarding flow"
  },
  SYNC_ALL_INTERVAL: {
    def: 2 * 60 * 1000,
    parser: intParser,
    desc: "delay between successive sync"
  },
  SYNC_BOOT_DELAY: {
    def: 2 * 1000,
    parser: intParser,
    desc: "delay before the sync starts"
  },
  SYNC_PENDING_INTERVAL: {
    def: 10 * 1000,
    parser: intParser,
    desc: "delay between sync when an operation is still pending"
  },
  SYNC_OUTDATED_CONSIDERED_DELAY: {
    def: 2 * 60 * 1000,
    parser: intParser,
    desc: "delay until Live consider a sync outdated"
  },
  SYNC_MAX_CONCURRENT: {
    def: 4,
    parser: intParser,
    desc: "maximum limit to synchronize accounts concurrently to limit overload"
  },
  USER_ID: {
    def: "",
    parser: stringParser,
    desc:
      "unique identifier of app instance. used to derivate dissociated ids for difference purposes (e.g. the firmware update incremental deployment)."
  },
  WITH_DEVICE_POLLING_DELAY: {
    def: 500,
    parser: floatParser,
    desc: "delay when polling device"
  }
};

const getDefinition = (name: string): ?EnvDef<any> => envDefinitions[name];

(envDefinitions: { [_: string]: EnvDef<any> });

const defaults: $ObjMap<EnvDefs, ExtractEnvValue> = mapValues(
  envDefinitions,
  o => o.def
);

// private local state
const env: $ObjMap<EnvDefs, ExtractEnvValue> = { ...defaults };

export const getAllEnvNames = (): EnvName[] => Object.keys(envDefinitions);

export const getAllEnvs = (): Env => ({ ...env });

// Usage: you must use getEnv at runtime because the env might be settled over time. typically will allow us to dynamically change them on the interface (e.g. some sort of experimental flags system)
export const getEnv = <Name: EnvName>(name: Name): EnvValue<Name> => env[name];

export const getEnvDefault = <Name: EnvName>(name: Name): EnvValue<Name> =>
  defaults[name];

export const isEnvDefault = <Name: EnvName>(name: Name): EnvValue<Name> =>
  defaults[name];

export const getEnvDesc = <Name: EnvName>(name: Name): string =>
  envDefinitions[name].desc;

type ChangeValue<T> = {
  name: EnvName,
  value: EnvValue<T>,
  oldValue: EnvValue<T>
};

export const changes: Subject<ChangeValue<any>> = new Subject();

// change one environment
export const setEnv = <Name: EnvName>(name: Name, value: EnvValue<Name>) => {
  const oldValue = env[name];
  if (oldValue !== value) {
    env[name] = value;
    changes.next({ name, value, oldValue });
  }
};

// change one environment with safety. returns true if it succeed
export const setEnvUnsafe = (name: string, unsafeValue: mixed): boolean => {
  const definition = getDefinition(name);
  if (!definition) return false;
  const { parser } = definition;
  const value = parser(unsafeValue);
  if (value === undefined || value === null) {
    console.warn(`Invalid ENV value for ${name}`);
    return false;
  }
  // $FlowFixMe flow don't seem to type proof it
  setEnv(name, value);
  return true;
};
