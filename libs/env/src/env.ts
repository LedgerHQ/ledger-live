// set and get environment & config variables
import { Subject } from "rxjs";
import { $ElementType } from "utility-types";
// type ExtractEnvValue = <V>(arg0: EnvDef<V>) => V;
type EnvDefs = typeof envDefinitions;
type Env = typeof env;

type EnvDef<T extends string> = T extends EnvName ? EnvDefs[T] : undefined;

export type EnvName = keyof EnvDefs;
export type EnvValue<Name extends EnvName> = $ElementType<Env, Name>;

const intParser = (v: any): number | undefined => {
  if (!Number.isNaN(v)) return parseInt(v, 10);
};

const floatParser = (v: any): number | undefined => {
  if (!Number.isNaN(v)) return parseFloat(v);
};

const boolParser = (v: unknown): boolean | undefined => {
  if (typeof v === "boolean") return v;
  return !(v === "0" || v === "false");
};

const stringParser = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

const jsonParser = (v: unknown): JSONValue | undefined => {
  try {
    if (typeof v !== "string") throw new Error();
    return JSON.parse(v);
  } catch (e) {
    return undefined;
  }
};

const stringArrayParser = (v: unknown): string[] | undefined => {
  const v_array = typeof v === "string" ? v.split(",") : null;
  if (Array.isArray(v_array) && v_array.length > 0) return v_array;
};

const envDefinitions = {
  ADDRESS_POISONING_FAMILIES: {
    def: "evm,tron",
    parser: stringParser,
    desc: "List of families impacted by the address poisoning attack",
  },
  ANALYTICS_CONSOLE: {
    def: false,
    parser: boolParser,
    desc: "Show tracking overlays on the app UI",
  },
  DEBUG_THEME: {
    def: false,
    parser: boolParser,
    desc: "Show theme debug overlay UI",
  },
  API_ICP_ENDPOINT: {
    def: "https://icp.coin.ledger.com/",
    parser: stringParser,
    desc: "Rosetta API for ICP",
  },
  API_CASPER_INDEXER_ENDPOINT: {
    parser: stringParser,
    def: "https://casper.coin.ledger.com/indexer",
    desc: "Casper API url indexer",
  },
  API_CASPER_NODE_ENDPOINT: {
    parser: stringParser,
    def: "https://casper.coin.ledger.com/node/",
    desc: "Casper API url node",
  },
  API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT: {
    def: "https://algorand.coin.ledger-stg.com",
    parser: stringParser,
    desc: "Node API endpoint for algorand",
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
  COSMOS_GAS_AMPLIFIER: {
    def: 1.3, // Same as Keplr
    parser: intParser,
    desc: "Cosmos gas estimate multiplier",
  },
  API_FILECOIN_ENDPOINT: {
    parser: stringParser,
    def: "https://filecoin.coin.ledger.com",
    desc: "Filecoin API url",
  },
  API_STACKS_ENDPOINT: {
    parser: stringParser,
    def: "https://stacks.coin.ledger.com",
    desc: "Stacks API url",
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
  API_POLKADOT_SIDECAR_CREDENTIALS: {
    parser: stringParser,
    def: "",
    desc: "Polkadot Sidecar API credentials",
  },
  API_POLKADOT_NODE: {
    parser: stringParser,
    def: "https://polkadot-fullnodes.api.live.ledger.com",
    desc: "Polkadot Node",
  },
  ELROND_API_ENDPOINT: {
    parser: stringParser,
    def: "https://elrond.coin.ledger.com",
    desc: "Elrond API url",
  },
  ELROND_DELEGATION_API_ENDPOINT: {
    parser: stringParser,
    def: "https://delegations-elrond.coin.ledger.com",
    desc: "Elrond DELEGATION API url",
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
    def: "https://xtz-tzkt-explorer.api-01.live.ledger-stg.com",
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
    def: "https://earn.api.live.ledger.com/v0/network/solana/validator-details",
    desc: "base url for validators.app validator list",
  },
  SOLANA_TESTNET_VALIDATORS_APP_BASE_URL: {
    parser: stringParser,
    def: "https://validators-solana.coin.ledger.com/api/v1/validators",
    desc: "base url for testnet validators.app validator list",
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
  API_VECHAIN_THOREST: {
    def: "https://vechain.coin.ledger.com",
    parser: stringParser,
    desc: "Thorest API for VeChain",
  },
  BASE_SOCKET_URL: {
    def: "wss://scriptrunner.api.live.ledger.com/update",
    parser: stringParser,
    desc: "Ledger script runner API",
  },
  BOT_TIMEOUT_SCAN_ACCOUNTS: {
    def: 10 * 60 * 1000,
    parser: intParser,
    desc: "bot's default timeout for scanAccounts",
  },
  BOT_SPEC_DEFAULT_TIMEOUT: {
    def: 30 * 60 * 1000,
    parser: intParser,
    desc: "define the default value of spec.skipMutationsTimeout (if not overriden by spec)",
  },
  BUY_API_BASE: {
    def: "https://buy.api.live.ledger.com/buy/v1",
    parser: stringParser,
    desc: "Buy crypto API base url - version 1",
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
  ICON_NODE_ENDPOINT: {
    parser: stringParser,
    def: "https://icon.coin.ledger.com/api/v3",
    desc: "ICON RPC url",
  },
  ICON_DEBUG_ENDPOINT: {
    parser: stringParser,
    def: "https://icon.coin.ledger.com/api/v3d",
    desc: "ICON debug RPC url",
  },
  ICON_INDEXER_ENDPOINT: {
    parser: stringParser,
    def: "https://icon.coin.ledger.com/api/v1",
    desc: "ICON API url",
  },
  ICON_TESTNET_NODE_ENDPOINT: {
    parser: stringParser,
    def: "https://berlin.net.solidwallet.io/api/v3",
    desc: "ICON Berlin Testnet API url",
  },
  ICON_TESTNET_DEBUG_ENDPOINT: {
    parser: stringParser,
    def: "https://berlin.net.solidwallet.io/api/v3d",
    desc: "ICON Berlin Testnet debug",
  },
  ICON_TESTNET_INDEXER_ENDPOINT: {
    parser: stringParser,
    def: "https://tracker.berlin.icon.community/api/v1",
    desc: "ICON Berlin Testnet API url",
  },
  COINAPPS: {
    def: "",
    parser: stringParser,
    desc: "(dev feature) defines the folder for speculos mode that contains Nano apps binaries (.elf) in a specific structure: <device>/<firmware>/<appName>/app_<appVersion>.elf",
  },
  CRYPTO_ORG_INDEXER: {
    def: "https://cryptoorg-rpc-indexer.coin.ledger.com",
    parser: stringParser,
    desc: "location of the Cronos POS Chain (formerly Crypto.org) indexer API",
  },
  CRYPTO_ORG_TESTNET_INDEXER: {
    def: "https://cronos-pos.org/explorer/croeseid4",
    parser: stringParser,
    desc: "location of the Cronos POS Chain (formerly Crypto.org) indexer testnet API",
  },
  CRYPTO_ORG_RPC_URL: {
    def: "https://cryptoorg-rpc-node.coin.ledger.com",
    parser: stringParser,
    desc: "location of the Cronos POS Chain (formerly Crypto.org) chain node",
  },
  CRYPTO_ORG_TESTNET_RPC_URL: {
    def: "https://rpc-testnet-croeseid-4.crypto.org",
    parser: stringParser,
    desc: "location of the Cronos POS Chain (formerly Crypto.org) chain testnet node",
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
  DISABLE_FW_UPDATE_VERSION_CHECK: {
    def: false,
    parser: boolParser,
    desc: "disable the version check for firmware update eligibility",
  },
  DETOX: {
    def: "",
    parser: stringParser,
    desc: "switch the app into a DETOX mode for test purpose. Avoid falsy values.",
  },
  EIP1559_MINIMUM_FEES_GATE: {
    def: true,
    parser: boolParser,
    desc: "prevents the user from doing an EIP1559 transaction with fees too low",
  },
  EIP1559_PRIORITY_FEE_LOWER_GATE: {
    def: 0.85,
    parser: floatParser,
    desc: "minimum priority fee percents allowed compared to network conditions allowed when EIP1559_MINIMUM_FEES_GATE is activated",
  },
  EIP1559_BASE_FEE_MULTIPLIER: {
    def: 1.27,
    parser: floatParser,
    desc: "mutiplier for the base fee that is composing the maxFeePerGas property",
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
  EXPERIMENTAL_EXPLORERS: {
    def: false,
    parser: boolParser,
    desc: "enable experimental explorer APIs",
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
  EXPORT_EXCLUDED_LOG_TYPES: {
    def: "ble-frame",
    parser: stringParser,
    desc: "comma-separated list of excluded log types for exported logs",
  },
  EXPORT_MAX_LOGS: {
    def: 5000,
    parser: intParser,
    desc: "maximum logs to keep for export",
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
  FILTER_ZERO_AMOUNT_ERC20_EVENTS: {
    def: true,
    parser: boolParser,
    desc: "Remove filter of address poisoning",
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
  LEDGER_CLIENT_VERSION: {
    def: "",
    parser: stringParser,
    desc: "the 'X-Ledger-Client-Version' HTTP header to use for queries to Ledger APIs",
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
  MAPPING_SERVICE: {
    def: "https://mapping-service.api.ledger.com",
    parser: stringParser,
    desc: "",
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
  MOCK_APP_UPDATE: {
    def: false,
    parser: boolParser,
    desc: "Always shows app update in the manager",
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
  MOCK_EXCHANGE_TEST_PARTNER: {
    def: false,
    parser: boolParser,
    desc: "change CAL partner context to test",
  },
  MOCK_REMOTE_LIVE_MANIFEST: {
    def: "",
    parser: stringParser,
    desc: "mock remote live app manifest",
  },
  MOCK_OS_VERSION: {
    def: "",
    parser: stringParser,
    desc: "if defined, overrides the os and version. format: os@version. Example: Windows_NT@6.1.7601",
  },
  MOCK_NO_BYPASS: {
    def: false,
    parser: boolParser,
    desc: "if defined, avoids bypass of the currentDevice in the store.",
  },
  NFT_CURRENCIES: {
    def: ["avalanche_c_chain", "bsc", "ethereum", "polygon"],
    parser: stringArrayParser,
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
  SIMPLE_HASH_API_BASE: {
    def: "https://simplehash.api.live.ledger.com/api/v0",
    parser: stringParser,
    desc: "SimpleHash API base url",
  },
  SKIP_ONBOARDING: {
    def: false,
    parser: boolParser,
    desc: "dev flag to skip onboarding flow",
  },
  SPECULOS_API_PORT: {
    def: 0,
    parser: intParser,
    desc: "API port for speculos",
  },
  SPECULOS_PID_OFFSET: {
    def: 0,
    parser: intParser,
    desc: "offset to be added to the speculos pid and avoid collision with other instances",
  },
  /**
   * It's just here as a backup, the REST API is supposed to be the right mode
   * We can always fallback on the previous method if we need to.
   * The websocket option is harmless, we can remove it at some point but let's
   * keep it for a while just in case.
   * Introduced on June 27th 2023 by https://github.com/LedgerHQ/ledger-live/pull/3824
   */
  SPECULOS_USE_WEBSOCKET: {
    def: false,
    parser: boolParser,
    desc: "Use speculos websocket interface instead of Rest API",
  },
  SWAP_API_BASE: {
    def: "https://swap.ledger.com/v5",
    parser: stringParser,
    desc: "Swap API base",
  },
  SWAP_USER_IP: {
    def: "",
    parser: stringParser,
    desc: "Swap IP",
  },
  SWAP_DISABLE_APPS_INSTALL: {
    def: false,
    parser: boolParser,
    desc: "bypass app checks on Nano for speculos swap tests",
  },
  SYNC_ALL_INTERVAL: {
    def: 8 * 60 * 1000,
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
    def: 10 * 60 * 1000,
    parser: intParser,
    desc: "delay until Live consider a sync outdated",
  },
  SYNC_MAX_CONCURRENT: {
    def: 4,
    parser: intParser,
    desc: "maximum limit to synchronize accounts concurrently to limit overload",
  },
  BOT_MAX_CONCURRENT: {
    def: 10,
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
  CLOUD_SYNC_API_STAGING: {
    def: "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
    parser: stringParser,
    desc: "wallet sync api staging base url",
  },
  CLOUD_SYNC_API_PROD: {
    def: "https://cloud-sync.api.live.ledger.com",
    parser: stringParser,
    desc: "wallet sync api production base url",
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
  TRUSTCHAIN_API_STAGING: {
    def: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
    parser: stringParser,
    desc: "Trustchain API Staging",
  },
  TRUSTCHAIN_API_PROD: {
    def: "https://trustchain.api.live.ledger.com",
    parser: stringParser,
    desc: "Trustchain API Prod",
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
    def: "https://live-app-catalog.ledger.com/api/v1/apps",
    parser: stringParser,
    desc: "url used to fetch platform app manifests",
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
  PLAYWRIGHT_RUN: {
    def: false,
    parser: boolParser,
    desc: "true when launched for E2E testing",
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
  DYNAMIC_CAL_BASE_URL: {
    def: "https://cdn.live.ledger.com/cryptoassets",
    parser: stringParser,
    desc: "bucket S3 of the dynamic cryptoassets list",
  },
  CAL_SERVICE_URL: {
    def: "https://crypto-assets-service.api.ledger.com",
    parser: stringParser,
    desc: "Cryptoassets list service url",
  },
  FEATURE_FLAGS: {
    def: "{}",
    parser: jsonParser,
    desc: "key value map for feature flags: {[key in FeatureId]?: Feature]}",
  },
  PERFORMANCE_CONSOLE: {
    def: false,
    parser: boolParser,
    desc: "Show a performance overlay on the app UI",
  },
  ETHEREUM_STUCK_TRANSACTION_TIMEOUT: {
    def: 5 * 60 * 1000,
    parser: intParser,
    desc: "Time after which an optimisc operation is considered stuck",
  },
  EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR: {
    def: 1.3,
    parser: floatParser,
    desc: "Replace transaction gasprice factor for legacy evm transaction. This value should be 1.1 minimum since this is the minimum increase required by most nodes",
  },
  EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR: {
    def: 1.3,
    parser: floatParser,
    desc: "Replace transaction max fee factor for EIP1559 evm transaction. This value should be 1.1 minimum since this is the minimum increase required by most nodes",
  },
  EVM_REPLACE_TX_EIP1559_MAXPRIORITYFEE_FACTOR: {
    def: 1.1,
    parser: floatParser,
    desc: "Replace transaction max priority fee factor for EIP1559 evm transaction. This value should be 1.1 minimum since this is the minimum increase required by most nodes",
  },
  EVM_FORCE_LEGACY_TRANSACTIONS: {
    def: false,
    parser: boolParser,
    desc: "Force transaction type 0 on EVM networks",
  },
  ENABLE_NETWORK_LOGS: {
    def: false,
    parser: boolParser,
    desc: "Enable network request and responses logs. Errors are always logged",
  },
  CRYPTO_ASSET_SEARCH_KEYS: {
    def: ["ticker", "name", "keywords"],
    parser: stringArrayParser,
    desc: "Fuse search attributes to find a currency according to user input",
  },
  VERBOSE: {
    def: [] as Array<string>,
    parser: stringArrayParser,
    desc: 'Sets up debug console printing of logs. `VERBOSE=1` or `VERBOSE=true`: to print all logs | `VERBOSE="apdu,hw,transport,hid-verbose"` : filtering on a list of log `type` separated by a `,`',
  },
  DEFAULT_TRANSACTION_POLLING_INTERVAL: {
    def: 30 * 1000,
    parser: intParser,
    desc: "Default interval to poll for transaction confirmation in speedup/cancel evm flow (in ms)",
  },
  LOW_BATTERY_PERCENTAGE: {
    def: 20,
    parser: intParser,
    desc: "Configure the low battery percentage threshold",
  },
  LOG_DRAWERS: {
    def: false,
    parser: boolParser,
    desc: "Enable logs for drawers",
  },
};

export const getDefinition = (name: string): EnvDef<any> => {
  if (name in envDefinitions) {
    return envDefinitions[name];
  }
  return undefined;
};

const defaults = Object.keys(envDefinitions).reduce<{ [Key in EnvName]: EnvDefs[Key]["def"] }>(
  (acc, curr) => {
    return {
      ...acc,
      [curr]: envDefinitions[curr].def,
    };
  },
  {} as { [Key in EnvName]: EnvDefs[Key]["def"] },
);

// private local state
const env = { ...defaults };
export const getAllEnvNames = (): EnvName[] => Object.keys(envDefinitions) as EnvName[];
export const getAllEnvs = (): Env => ({ ...env });
// Usage: you must use getEnv at runtime because the env might be settled over time. typically will allow us to dynamically change them on the interface (e.g. some sort of experimental flags system)
export const getEnv = <Name extends EnvName>(name: Name): EnvValue<Name> => env[name];
export const getEnvDefault = <Name extends EnvName>(name: Name): EnvValue<Name> => defaults[name];
export const isEnvDefault = <Name extends EnvName>(name: Name): boolean =>
  env[name] === defaults[name];
export const getEnvDesc = <Name extends EnvName>(name: Name): string => envDefinitions[name].desc;
type ChangeValue<T extends EnvName> = {
  name: EnvName;
  value: EnvValue<T>;
  oldValue: EnvValue<T>;
};
export const changes: Subject<ChangeValue<any>> = new Subject();
// change one environment
export const setEnv = <Name extends EnvName>(name: Name, value: EnvValue<Name>): void => {
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
export const setEnvUnsafe = (name: string, unsafeValue: unknown): boolean => {
  const definition = getDefinition(name);
  if (!definition) return false;
  const { parser } = definition;
  const value = parser(unsafeValue);

  if (value === undefined || value === null) {
    console.warn(`Invalid ENV value for ${name}`);
    return false;
  }

  setEnv(name as EnvName, value);
  return true;
};
