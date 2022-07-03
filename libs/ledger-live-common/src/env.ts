import mapValues from "lodash/mapValues";
// set and get environment & config variables
import { Subject } from "rxjs";
import { $ElementType } from "utility-types";
type EnvDef<V> = {
  desc: string;
  def: V;
  parser: (arg0: unknown) => V | null | undefined;
};
// type ExtractEnvValue = <V>(arg0: EnvDef<V>) => V;
type EnvDefs = typeof envDefinitions;
type Env = typeof env;
export type EnvName = keyof EnvDefs;
export type EnvValue<Name extends EnvName> = $ElementType<Env, Name>;

const intParser = (v: any): number | null | undefined => {
  if (!Number.isNaN(v)) return parseInt(v, 10);
};

const floatParser = (v: any): number | null | undefined => {
  if (!Number.isNaN(v)) return parseFloat(v);
};

const boolParser = (v: unknown): boolean | null | undefined => {
  if (typeof v === "boolean") return v;
  return !(v === "0" || v === "false");
};

const stringParser = (v: unknown): string | null | undefined =>
  typeof v === "string" ? v : undefined;

const envDefinitions = {
  ANALYTICS_CONSOLE: {
    def: false,
    parser: boolParser,
    desc: "Show tracking overlays on the app UI",
  },
  API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT: {
    def: "https://algorand.coin.ledger.com",
    parser: stringParser,
    desc: "Node API endpoint for algorand",
  },
  API_BIM: {
    def: "https://bim-staging.api.ledger.com",
    parser: stringParser,
    desc: "Endpoint for long handling long running tasks",
  },
  API_CELO_INDEXER: {
    def: "https://celo.coin.ledger.com/indexer/",
    parser: stringParser,
    desc: "Explorer API for celo",
  },
  API_CELO_NODE: {
    def: "https://celo.coin.ledger.com/archive/",
    parser: stringParser,
    desc: "Node endpoint for celo",
  },
  API_COSMOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT: {
    def: "https://cosmoshub4.coin.ledger.com/",
    parser: stringParser,
    desc: "Node endpoint for cosmos",
  },
  API_COSMOS_NODE: {
    def: "STARGATE_NODE",
    parser: stringParser,
    desc: "Node API to use for cosmos (COSMOS_NODE or STARGATE_NODE are known)",
  },
  API_COSMOS_TESTNET_BLOCKCHAIN_EXPLORER_API_ENDPOINT: {
    def: "https://cosmoshub4.coin.staging.aws.ledger.com",
    parser: stringParser,
    desc: "Node endpoint for cosmos",
  },
  API_COSMOS_TESTNET_NODE: {
    def: "STARGATE_NODE",
    parser: stringParser,
    desc: "Node API to use for cosmos_testnet (COSMOS_NODE or STARGATE_NODE are known)",
  },
  API_RIPPLE_RPC: {
    parser: stringParser,
    def: "https://xrplcluster.com/ledgerlive",
    desc: "XRP Ledger full history open JSON-RPC endpoint",
  },
  API_FILECOIN_ENDPOINT: {
    parser: stringParser,
    def: "https://filecoin.coin.ledger.com",
    desc: "Filecoin API url",
  },
  API_POLKADOT_INDEXER: {
    parser: stringParser,
    def: "https://polkadot.coin.ledger.com",
    desc: "Explorer API for polkadot",
  },
  API_POLKADOT_SIDECAR: {
    parser: stringParser,
    def: "https://polkadot-sidecar.coin.ledger.com",
    desc: "Polkadot Sidecar API url",
  },
  ELROND_API_ENDPOINT: {
    parser: stringParser,
    def: "https://elrond.coin.ledger.com",
    desc: "Elrond API url",
  },
  API_STELLAR_HORIZON: {
    parser: stringParser,
    def: "https://stellar.coin.ledger.com",
    desc: "Stellar Horizon API url",
  },
  API_STELLAR_HORIZON_FETCH_LIMIT: {
    parser: intParser,
    def: 100,
    desc: "Limit of operation that Horizon will fetch per page",
  },
  API_STELLAR_HORIZON_STATIC_FEE: {
    def: false,
    parser: boolParser,
    desc: "Static fee for Stellar account",
  },
  API_OSMOSIS_INDEXER: {
    def: "https://osmosis.coin.ledger.com/indexer",
    parser: stringParser,
    desc: "Endpoint for Transaction Explorer/Indexer for Osmosis",
  },
  API_OSMOSIS_NODE: {
    def: "https://osmosis.coin.ledger.com/node",
    parser: stringParser,
    desc: "Endpoint for Osmosis Node",
  },
  API_TEZOS_BAKER: {
    parser: stringParser,
    def: "https://tezos-bakers.api.live.ledger.com",
    desc: "bakers API for tezos",
  },
  API_TEZOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT: {
    def: "https://xtz-explorer.api.live.ledger.com/explorer",
    parser: stringParser,
    desc: "Ledger explorer API for tezos",
  },
  API_TEZOS_TZKT_API: {
    def: "https://xtz-tzkt-explorer.api.live.ledger.com",
    parser: stringParser,
    desc: "tzkt.io explorer",
  },
  API_TEZOS_NODE: {
    def: "https://xtz-node.api.live.ledger.com",
    parser: stringParser,
    desc: "node API for tezos (for broadcast only)",
  },
  API_TRONGRID_PROXY: {
    parser: stringParser,
    def: "https://tron.coin.ledger.com",
    desc: "proxy url for trongrid API",
  },
  API_SOLANA_PROXY: {
    parser: stringParser,
    def: "https://solana.coin.ledger.com",
    desc: "proxy url for solana API",
  },
  SOLANA_VALIDATORS_APP_BASE_URL: {
    parser: stringParser,
    def: "https://validators-solana.coin.ledger.com/api/v1/validators",
    desc: "base url for validators.app validator list",
  },
  SOLANA_TX_CONFIRMATION_TIMEOUT: {
    def: 100 * 1000,
    parser: intParser,
    desc: "solana transaction broadcast confirmation timeout",
  },
  API_HEDERA_MIRROR: {
    def: "https://hedera.coin.ledger.com",
    parser: stringParser,
    desc: "mirror node API for Hedera",
  },
  BASE_SOCKET_URL: {
    def: "wss://scriptrunner.api.live.ledger.com/update",
    parser: stringParser,
    desc: "Ledger script runner API",
  },
  BOT_TIMEOUT_SCAN_ACCOUNTS: {
    def: 30 * 60 * 1000,
    parser: intParser,
    desc: "bot's default timeout for scanAccounts",
  },
  CARDANO_API_ENDPOINT: {
    def: "https://cardano.coin.ledger.com/api",
    parser: stringParser,
    desc: "Cardano API url",
  },
  CARDANO_TESTNET_API_ENDPOINT: {
    def: "https://testnet-ledger.cardanoscan.io/api",
    parser: stringParser,
    desc: "Cardano API url",
  },
  COINAPPS: {
    def: "",
    parser: stringParser,
    desc: "(dev feature) defines the folder for speculos mode that contains Nano apps binaries (.elf) in a specific structure: <device>/<firmware>/<appName>/app_<appVersion>.elf",
  },
  COMPOUND_API: {
    def: "https://api.compound.finance",
    parser: stringParser,
    desc: "location of the compound API",
  },
  COSMOS_GAS_AMPLIFIER: {
    def: 1.4,
    parser: intParser,
    desc: "estimate gas multiplier",
  },
  COSMOS_GAS_PRICE: {
    def: 0.025,
    parser: floatParser,
    desc: "gasLimit * gasPrice to determine the fees price. A too low GAS_PRICE will get rejected before the transaction is broadcast",
  },
  CRYPTO_ORG_INDEXER: {
    def: "https://cryptoorg-rpc-indexer.coin.ledger.com",
    parser: stringParser,
    desc: "location of the crypto.org indexer API",
  },
  CRYPTO_ORG_TESTNET_INDEXER: {
    def: "https://crypto.org/explorer/croeseid4",
    parser: stringParser,
    desc: "location of the crypto.org indexer testnet API",
  },
  CRYPTO_ORG_RPC_URL: {
    def: "https://cryptoorg-rpc-node.coin.ledger.com",
    parser: stringParser,
    desc: "location of the crypto.org chain node",
  },
  CRYPTO_ORG_TESTNET_RPC_URL: {
    def: "https://testnet-croeseid-4.crypto.org:26657",
    parser: stringParser,
    desc: "location of the crypto.org chain testnet node",
  },
  DEBUG_UTXO_DISPLAY: {
    def: 4,
    parser: intParser,
    desc: "define maximum number of utxos to display in CLI",
  },
  DEBUG_HTTP_RESPONSE: {
    def: false,
    parser: boolParser,
    desc: "includes HTTP response body in logs",
  },
  DEVICE_CANCEL_APDU_FLUSH_MECHANISM: {
    def: true,
    parser: boolParser,
    desc: "enable a mechanism that send a 0x00 apdu to force device to awake from its 'Processing' UI state",
  },
  DEVICE_PROXY_URL: {
    def: "",
    parser: stringParser,
    desc: "enable a proxy to use instead of a physical device",
  },
  DEVICE_PROXY_MODEL: {
    def: "nanoS",
    parser: stringParser,
    desc: "allow to override the default model of a proxied device",
  },
  DISABLE_TRANSACTION_BROADCAST: {
    def: false,
    parser: boolParser,
    desc: "disable broadcast of transactions",
  },
  DISABLE_SYNC_TOKEN: {
    def: true,
    parser: boolParser,
    desc: "disable a problematic mechanism of our API",
  },
  ETHEREUM_GAS_LIMIT_AMPLIFIER: {
    def: 1.2,
    parser: floatParser,
    desc: "Ethereum gasLimit multiplier for contracts to prevent out of gas issue",
  },
  EXPERIMENTAL_BLE: {
    def: false,
    parser: boolParser,
    desc: "enable experimental support of Bluetooth",
  },
  EXPERIMENTAL_CURRENCIES: {
    def: "",
    parser: stringParser,
    desc: "enable experimental support of currencies (comma separated)",
  },
  EXPERIMENTAL_EIP712: {
    def: false,
    parser: boolParser,
    desc: "enable experimental support for EIP712",
  },
  EXPERIMENTAL_EXPLORERS: {
    def: false,
    parser: boolParser,
    desc: "enable experimental explorer APIs",
  },
  EXPERIMENTAL_FALLBACK_APDU_LISTAPPS: {
    def: false,
    parser: boolParser,
    desc: "if HSM list apps fails, fallback on APDU version (>=1.6.0)",
  },
  EXPERIMENTAL_LANGUAGES: {
    def: false,
    parser: boolParser,
    desc: "enable experimental languages",
  },
  EXPERIMENTAL_MANAGER: {
    def: false,
    parser: boolParser,
    desc: "enable an experimental version of Manager",
  },
  EXPERIMENTAL_ROI_CALCULATION: {
    def: false,
    parser: boolParser,
    desc: "enable an experimental version of the portfolio percentage calculation",
  },
  EXPERIMENTAL_SEND_MAX: {
    def: false,
    parser: boolParser,
    desc: "force enabling SEND MAX even if not yet stable",
  },
  EXPERIMENTAL_USB: {
    def: false,
    parser: boolParser,
    desc: "enable an experimental implementation of USB support",
  },
  EXPERIMENTAL_SWAP: {
    def: false,
    parser: boolParser,
    desc: "enable an experimental swap interface",
  },
  EXPLORER: {
    def: "https://explorers.api.live.ledger.com",
    parser: stringParser,
    desc: "Ledger generic explorer API",
  },
  EXPLORER_STAGING: {
    def: "https://explorers.api-01.live.ledger-stg.com",
    parser: stringParser,
    desc: "Ledger staging explorer API",
  },
  EXPLORER_BETA: {
    def: "https://explorers.api.live.ledger.com",
    parser: stringParser,
    desc: "Ledger generic explorer beta API",
  },
  EXPLORER_SATSTACK: {
    def: "http://localhost:20000",
    parser: stringParser,
    desc: "Ledger satstack Bitcoin explorer API",
  },
  DISABLE_APP_VERSION_REQUIREMENTS: {
    def: false,
    parser: boolParser,
    desc: "force an old application version to be accepted regardless of its version",
  },
  FORCE_PROVIDER: {
    def: 1,
    parser: intParser,
    desc: "use a different provider for app store (for developers only)",
  },
  GET_CALLS_RETRY: {
    def: 2,
    parser: intParser,
    desc: "how many times to retry a GET http call",
  },
  GET_CALLS_TIMEOUT: {
    def: 60 * 1000,
    parser: intParser,
    desc: "how much time to timeout a GET http call",
  },
  HIDE_EMPTY_TOKEN_ACCOUNTS: {
    def: false,
    parser: boolParser,
    desc: "hide the sub accounts when they are empty",
  },
  KEYCHAIN_OBSERVABLE_RANGE: {
    def: 0,
    parser: intParser,
    desc: "overrides the gap limit specified by BIP44 (default to 20)",
  },
  LEDGER_COUNTERVALUES_API: {
    def: "https://countervalues.live.ledger.com",
    parser: stringParser,
    desc: "Ledger countervalues API",
  },
  LEDGER_REST_API_BASE: {
    def: "https://explorers.api.live.ledger.com",
    parser: stringParser,
    desc: "DEPRECATED",
  },
  LEGACY_KT_SUPPORT_TO_YOUR_OWN_RISK: {
    def: false,
    parser: boolParser,
    desc: "enable sending to KT accounts. Not tested.",
  },
  MANAGER_API_BASE: {
    def: "https://manager.api.live.ledger.com/api",
    parser: stringParser,
    desc: "Ledger Manager API",
  },
  MANAGER_DEV_MODE: {
    def: false,
    parser: boolParser,
    desc: "enable visibility of utility apps in Manager",
  },
  MANAGER_INSTALL_DELAY: {
    def: 1000,
    parser: intParser,
    desc: "defines the time to wait before installing apps to prevent known glitch (<=1.5.5) when chaining installs",
  },
  MAX_ACCOUNT_NAME_SIZE: {
    def: 50,
    parser: intParser,
    desc: "maximum size of account names",
  },
  MOCK: {
    def: "",
    parser: stringParser,
    desc: "switch the app into a MOCK mode for test purpose, the value will be used as a seed for the rng. Avoid falsy values.",
  },
  MOCK_COUNTERVALUES: {
    def: "",
    parser: stringParser,
    desc: "switch the countervalues resolution into a MOCK mode for test purpose",
  },
  MOCK_SWAP_KYC: {
    def: "",
    parser: stringParser,
    desc: "mock the server response for the exchange KYC check, options are 'open', 'pending', 'closed' or 'approved'.",
  },
  MOCK_SWAP_CHECK_QUOTE: {
    def: "",
    parser: stringParser,
    desc: "mock the server response for the exchange check quote, options are 'RATE_VALID', 'KYC_FAILED', 'KYC_PENDING', 'KYC_UNDEFINED', 'KYC_UPGRADE_REQUIRED', 'MFA_REQUIRED', 'OVER_TRADE_LIMIT', 'UNKNOW_USER' or 'UNKNOWN_ERROR'.",
  },
  MOCK_SWAP_WIDGET_BASE_URL: {
    def: "",
    parser: stringParser,
    desc: "mock the FTX swap widget base url",
  },
  /**
   * Note: the mocked cryptoassets config and test partner are signed with the
   * Ledger test private key
   */
  MOCK_EXCHANGE_TEST_CONFIG: {
    def: false,
    parser: boolParser,
    desc: "mock the cryptoassets config and test partner (in the context of app-exchange)",
  },
  MOCK_REMOTE_LIVE_MANIFEST: {
    def: "",
    parser: stringParser,
    desc: "mock remote live app manifest",
  },
  NFT_CURRENCIES: {
    def: "ethereum,polygon",
    parser: stringParser,
    desc: "set the currencies where NFT is active",
  },
  NFT_ETH_METADATA_SERVICE: {
    def: "https://nft.api.live.ledger.com",
    parser: stringParser,
    desc: "service uri used to get the metadata of an nft",
  },
  OPERATION_ADDRESSES_LIMIT: {
    def: 100,
    parser: intParser,
    desc: "limit the number of addresses in from/to of operations",
  },
  OPERATION_OPTIMISTIC_RETENTION: {
    def: 30 * 60 * 1000,
    parser: intParser,
    desc: "timeout to keep an optimistic operation that was broadcasted but not yet visible from the coin implementation or the API",
  },
  OPERATION_PAGE_SIZE_INITIAL: {
    def: 100,
    parser: intParser,
    desc: "defines the initial default operation length page to use",
  },
  POLKADOT_ELECTION_STATUS_THRESHOLD: {
    def: 25,
    parser: intParser,
    desc: "in blocks - number of blocks before Polkadot election effectively opens to consider it as open and disable all staking features",
  },
  SATSTACK: {
    def: false,
    parser: boolParser,
    desc: "Switch to satstack mode",
  },
  SCAN_FOR_INVALID_PATHS: {
    def: false,
    parser: boolParser,
    desc: "enable searching accounts in exotic derivation paths",
  },
  SEED: {
    def: "",
    parser: stringParser,
    desc: "(dev feature) seed to be used by speculos (device simulator)",
  },
  SHOW_LEGACY_NEW_ACCOUNT: {
    def: false,
    parser: boolParser,
    desc: "allow the creation of legacy accounts",
  },
  SKIP_ONBOARDING: {
    def: false,
    parser: boolParser,
    desc: "dev flag to skip onboarding flow",
  },
  SWAP_API_BASE: {
    def: "https://swap.ledger.com/v4",
    parser: stringParser,
    desc: "Swap API base",
  },
  SYNC_ALL_INTERVAL: {
    def: 2 * 60 * 1000,
    parser: intParser,
    desc: "delay between successive sync",
  },
  SYNC_BOOT_DELAY: {
    def: 2 * 1000,
    parser: intParser,
    desc: "delay before the sync starts",
  },
  SYNC_PENDING_INTERVAL: {
    def: 10 * 1000,
    parser: intParser,
    desc: "delay between sync when an operation is still pending",
  },
  SYNC_OUTDATED_CONSIDERED_DELAY: {
    def: 2 * 60 * 1000,
    parser: intParser,
    desc: "delay until Live consider a sync outdated",
  },
  SYNC_MAX_CONCURRENT: {
    def: 4,
    parser: intParser,
    desc: "maximum limit to synchronize accounts concurrently to limit overload",
  },
  BOT_MAX_CONCURRENT: {
    def: 5,
    parser: intParser,
    desc: "maximum limit to run bot spec in parallel",
  },
  USER_ID: {
    def: "",
    parser: stringParser,
    desc: "unique identifier of app instance. used to derivate dissociated ids for difference purposes (e.g. the firmware update incremental deployment).",
  },
  WALLETCONNECT: {
    def: false,
    parser: boolParser,
    desc: "is walletconnect enabled",
  },
  WITH_DEVICE_POLLING_DELAY: {
    def: 500,
    parser: floatParser,
    desc: "delay when polling device",
  },
  ANNOUNCEMENTS_API_URL: {
    def: "https://cdn.live.ledger.com/announcements",
    parser: stringParser,
    desc: "url used to fetch new announcements",
  },
  ANNOUNCEMENTS_API_VERSION: {
    def: 1,
    parser: intParser,
    desc: "version used for the announcements api",
  },
  STATUS_API_URL: {
    def: "https://ledger.statuspage.io/api",
    parser: stringParser,
    desc: "url used to fetch ledger status",
  },
  STATUS_API_VERSION: {
    def: 2,
    parser: intParser,
    desc: "version used for ledger status api",
  },
  TEZOS_MAX_TX_QUERIES: {
    def: 100,
    parser: intParser,
    desc: "safe max on maximum number of queries to synchronize a tezos account",
  },
  PLATFORM_DEBUG: {
    def: false,
    parser: boolParser,
    desc: "enable visibility of debug apps and tools in Platform Catalog",
  },
  PLATFORM_EXPERIMENTAL_APPS: {
    def: false,
    parser: boolParser,
    desc: "enable visibility of experimental apps and tools in Platform Catalog",
  },
  PLATFORM_MANIFEST_API_URL: {
    def: "https://cdn.live.ledger.com/platform/apps/v1/data.json",
    parser: stringParser,
    desc: "url used to fetch platform app manifests",
  },
  PLATFORM_MANIFEST_STAGING_API_URL: {
    def: "https://cdn.live.ledger-stg.com/platform/apps/v1/data.json",
    parser: stringParser,
    desc: "url used to fetch platform app manifests (staging)",
  },
  PLATFORM_LOCAL_MANIFEST_JSON: {
    def: "",
    parser: stringParser,
    desc: 'json manifest for a local (test) platform app manifests. How to use: PLATFORM_LOCAL_MANIFEST_JSON="$(cat /path/to/file.json)"',
  },
  PLATFORM_GLOBAL_CATALOG_API_URL: {
    def: "https://cdn.live.ledger.com/platform/catalog/v1/data.json",
    parser: stringParser,
    desc: "url used to fetch platform app manifests",
  },
  PLATFORM_GLOBAL_CATALOG_STAGING_API_URL: {
    def: "https://cdn.live.ledger-stg.com/platform/catalog/v1/data.json",
    parser: stringParser,
    desc: "url used to fetch platform app manifests (staging)",
  },
  PLATFORM_RAMP_CATALOG_API_URL: {
    def: "https://cdn.live.ledger.com/platform/trade/v1/data.json",
    parser: stringParser,
    desc: "url used to fetch platform app manifests",
  },
  PLATFORM_RAMP_CATALOG_STAGING_API_URL: {
    def: "https://cdn.live.ledger-stg.com/platform/trade/v1/data.json",
    parser: stringParser,
    desc: "url used to fetch platform app manifests (staging)",
  },
  PLATFORM_API_URL: {
    def: "",
    parser: stringParser,
    desc: "url used to fetch platform catalog",
  },
  PLATFORM_API_VERSION: {
    def: 1,
    parser: intParser,
    desc: "version used for the platform api",
  },
  MARKET_API_URL: {
    def: "https://proxycg.api.live.ledger.com/api/v3",
    parser: stringParser,
    desc: "Market data api",
  },
  USE_LEARN_STAGING_URL: {
    def: false,
    parser: boolParser,
    desc: "use the staging URL for the learn page",
  },
};

const getDefinition = (name: string): EnvDef<any> | null | undefined =>
  envDefinitions[name];

envDefinitions as Record<EnvName, EnvDef<any>>;
const defaults: Record<EnvName, any> = mapValues(
  envDefinitions,
  (o) => o.def
) as unknown as Record<EnvName, any>;
// private local state
const env: Record<EnvName, any> = { ...defaults };
export const getAllEnvNames = (): EnvName[] =>
  Object.keys(envDefinitions) as EnvName[];
export const getAllEnvs = (): Env => ({ ...env });
// Usage: you must use getEnv at runtime because the env might be settled over time. typically will allow us to dynamically change them on the interface (e.g. some sort of experimental flags system)
export const getEnv = <Name extends EnvName>(name: Name): EnvValue<Name> =>
  env[name];
export const getEnvDefault = <Name extends EnvName>(
  name: Name
): EnvValue<Name> => defaults[name];
export const isEnvDefault = <Name extends EnvName>(name: Name): boolean =>
  env[name] === defaults[name];
export const getEnvDesc = <Name extends EnvName>(name: Name): string =>
  envDefinitions[name].desc;
type ChangeValue<T extends EnvName> = {
  name: EnvName;
  value: EnvValue<T>;
  oldValue: EnvValue<T>;
};
export const changes: Subject<ChangeValue<any>> = new Subject();
// change one environment
export const setEnv = <Name extends EnvName>(
  name: Name,
  value: EnvValue<Name>
): void => {
  const oldValue = env[name];

  if (oldValue !== value) {
    env[name] = value;
    changes.next({
      name,
      value,
      oldValue,
    });
  }
};
// change one environment with safety. returns true if it succeed
export const setEnvUnsafe = (name: EnvName, unsafeValue: unknown): boolean => {
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
