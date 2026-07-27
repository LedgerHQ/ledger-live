// set and get environment & config variables
export { injectDefinitions, changes } from "./state";
import { configured, notifyChange } from "./state";
import type { EnvDef as EnvDefRecord } from "./state";

// All known env-var names and their TypeScript types.
// Values (defaults) are NOT here — they live in @shared/env via injectDefinitions().
export interface EnvTypes {
  APTOS_API_ENDPOINT: string;
  APTOS_TESTNET_API_ENDPOINT: string;
  APTOS_INDEXER_ENDPOINT: string;
  APTOS_TESTNET_INDEXER_ENDPOINT: string;
  APTOS_ENABLE_TOKENS: boolean;
  APTOS_ENABLE_STAKING: boolean;
  API_FILECOIN_ENDPOINT: string;
  API_STACKS_ENDPOINT: string;
  API_KASPA_ENDPOINT: string;
  API_VECHAIN_THOREST: string;
  API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT: string;
  BITCOIN_STUCK_TRANSACTION_TIMEOUT: number;
  COSMOS_GAS_AMPLIFIER: number;
  API_POLKADOT_INDEXER: string;
  API_POLKADOT_SIDECAR: string;
  API_POLKADOT_SIDECAR_CREDENTIALS: string;
  API_POLKADOT_NODE: string;
  POLKADOT_ELECTION_STATUS_THRESHOLD: number;
  MULTIVERSX_API_ENDPOINT: string;
  MULTIVERSX_DELEGATION_API_ENDPOINT: string;
  API_STELLAR_HORIZON: string;
  API_STELLAR_HORIZON_FETCH_LIMIT: number;
  API_STELLAR_HORIZON_STATIC_FEE: boolean;
  API_TRONGRID_PROXY: string;
  API_SOLANA_PROXY: string;
  SOLANA_VALIDATORS_APP_BASE_URL: string;
  SOLANA_VALIDATORS_SUMMARY_BASE_URL: string;
  SOLANA_TESTNET_VALIDATORS_APP_BASE_URL: string;
  SOLANA_TX_CONFIRMATION_TIMEOUT: number;
  ICON_NODE_ENDPOINT: string;
  ICON_DEBUG_ENDPOINT: string;
  ICON_INDEXER_ENDPOINT: string;
  ICON_TESTNET_NODE_ENDPOINT: string;
  ICON_TESTNET_DEBUG_ENDPOINT: string;
  ICON_TESTNET_INDEXER_ENDPOINT: string;
  CRYPTO_ORG_INDEXER: string;
  CRYPTO_ORG_TESTNET_INDEXER: string;
  CRYPTO_ORG_RPC_URL: string;
  CRYPTO_ORG_TESTNET_RPC_URL: string;
  EIP1559_MINIMUM_FEES_GATE: boolean;
  EIP1559_PRIORITY_FEE_LOWER_GATE: number;
  EIP1559_BASE_FEE_MULTIPLIER: number;
  ETHEREUM_STUCK_TRANSACTION_TIMEOUT: number;
  EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR: number;
  EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR: number;
  EVM_REPLACE_TX_EIP1559_MAXPRIORITYFEE_FACTOR: number;
  EVM_FORCE_LEGACY_TRANSACTIONS: boolean;
  PLATFORM_DEBUG: boolean;
  PLATFORM_EXPERIMENTAL_APPS: boolean;
  PLATFORM_MANIFEST_API_URL: string;
  PLATFORM_LOCAL_MANIFEST_JSON: string;
  PLATFORM_GLOBAL_CATALOG_API_URL: string;
  PLATFORM_GLOBAL_CATALOG_STAGING_API_URL: string;
  PLATFORM_RAMP_CATALOG_API_URL: string;
  PLATFORM_RAMP_CATALOG_STAGING_API_URL: string;
  PLATFORM_API_URL: string;
  PLATFORM_API_VERSION: number;
  WALLETCONNECT: boolean;
  WALLETCONNECT_PROJECT_ID: string;
  NFT_CURRENCIES: string[];
  NFT_METADATA_SERVICE: string;
  ADDRESS_POISONING_FAMILIES: string;
  FILTER_ZERO_AMOUNT_ERC20_EVENTS: boolean;
  SANCTIONED_ADDRESSES_URL: string;
  EXPERIMENTAL_EXPLORERS: boolean;
  EXPERIMENTAL_SEND_MAX: boolean;
  MOCK_REMOTE_LIVE_MANIFEST: string;
  EXPLORER: string;
  EXPLORER_REGTEST: string;
  LEDGER_REST_API_BASE: string;
  CAL_REF: string;
  DYNAMIC_CAL_BASE_URL: string;
  CAL_SERVICE_URL: string;
  CAL_SERVICE_URL_STAGING: string;
  LEDGER_CLIENT_VERSION: string;
  BOT_TIMEOUT_SCAN_ACCOUNTS: number;
  BOT_SPEC_DEFAULT_TIMEOUT: number;
  BOT_MAX_CONCURRENT: number;
  SYNC_ALL_INTERVAL: number;
  SYNC_BOOT_DELAY: number;
  SYNC_PENDING_INTERVAL: number;
  SYNC_OUTDATED_CONSIDERED_DELAY: number;
  SYNC_MAX_CONCURRENT: number;
  OPERATION_ADDRESSES_LIMIT: number;
  OPERATION_OPTIMISTIC_RETENTION: number;
  OPERATION_PAGE_SIZE_INITIAL: number;
  DISABLE_SYNC_TOKEN: boolean;
  DISABLE_TRANSACTION_BROADCAST: boolean;
  GET_CALLS_RETRY: number;
  GET_CALLS_TIMEOUT: number;
  SCAN_FOR_INVALID_PATHS: boolean;
  KEYCHAIN_OBSERVABLE_RANGE: number;
  DEFAULT_TRANSACTION_POLLING_INTERVAL: number;
  DEBUG_HTTP_RESPONSE: boolean;
  ENABLE_NETWORK_LOGS: boolean;
  DEBUG_UTXO_DISPLAY: number;
  INDEXER_BOILERPLATE: string;
  NODE_BOILERPLATE: string;
  SKIP_ONBOARDING: boolean;
  ANALYTICS_CONSOLE: boolean;
  HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID: string;
  HEDERA_STAKING_REWARD_ACCOUNT_ID: string;
  HEDERA_STAKING_LEDGER_NODE_ID: number;
  HEDERA_TOKEN_ASSOCIATION_MIN_USD: number;
  API_HEDERA_MIRROR: string;
  API_HEDERA_MIRROR_TESTNET: string;
  API_HEDERA_HGRAPH: string;
  API_HEDERA_HGRAPH_TESTNET: string;
  ALEO_NODE_ENDPOINT: string;
  ALEO_MAINNET_SDK_ENDPOINT: string;
  ALEO_TESTNET_SDK_ENDPOINT: string;
  API_CELO_INDEXER: string;
  API_CELO_NODE: string;
  ENABLE_CELO_TOKENS: boolean;
  API_TEZOS_BAKER: string;
  API_TEZOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT: string;
  API_TEZOS_TZKT_API: string;
  API_TEZOS_NODE: string;
  TEZOS_MAX_TX_QUERIES: number;
  API_SUI_TESTNET_NODE_PROXY: string;
  API_SUI_NODE_PROXY: string;
  API_SUI_GRAPHQL_PROXY: string;
  API_SUI_TESTNET_GRAPHQL_PROXY: string;
  SUI_ENABLE_TOKENS: boolean;
  CANTON_API_KEY: string;
  CANTON_NODE_ID_OVERRIDE: string;
  CARDANO_API_ENDPOINT: string;
  CARDANO_TESTNET_API_ENDPOINT: string;
  CARDANO_EPOCH_PARAMS_ENDPOINT: string;
  CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT: string;
  LEGACY_KT_SUPPORT_TO_YOUR_OWN_RISK: boolean;
  MANAGER_API_BASE: string;
  MANAGER_DEV_MODE: boolean;
  MANAGER_INSTALL_DELAY: number;
  DEVICE_CANCEL_APDU_FLUSH_MECHANISM: boolean;
  DEVICE_PROXY_URL: string;
  DEVICE_PROXY_MODEL: string;
  BASE_SOCKET_URL: string;
  DISABLE_FW_UPDATE_VERSION_CHECK: boolean;
  DISABLE_APP_VERSION_REQUIREMENTS: boolean;
  WITH_DEVICE_POLLING_DELAY: number;
  LOW_BATTERY_PERCENTAGE: number;
  USER_ID: string;
  COINAPPS: string;
  SEED: string;
  SPECULOS_API_PORT: number;
  SPECULOS_DEVICE: string;
  SPECULOS_FIRMWARE_VERSION: string;
  SPECULOS_PID_OFFSET: number;
  SPECULOS_USE_WEBSOCKET: boolean;
  EXPERIMENTAL_BLE: boolean;
  EXPERIMENTAL_MANAGER: boolean;
  EXPERIMENTAL_USB: boolean;
  MOCK_APP_UPDATE: boolean;
  FORCE_PROVIDER: number;
  MOCK: string;
  MOCK_OS_VERSION: string;
  MOCK_NO_BYPASS: boolean;
  STATUS_API_URL: string;
  STATUS_API_VERSION: number;
  PUSH_DEVICES_SERVICE_URL: string;
  VERBOSE: string[];
  EXPORT_EXCLUDED_LOG_TYPES: string;
  EXPORT_MAX_LOGS: number;
  LOG_DRAWERS: boolean;
  PERFORMANCE_CONSOLE: boolean;
  STORAGE_PERFORMANCE_OVERLAY: boolean;
  JS_THREAD_MONITOR: boolean;
  CLOUD_SYNC_API_STAGING: string;
  CLOUD_SYNC_API_PROD: string;
  TRUSTCHAIN_API_STAGING: string;
  TRUSTCHAIN_API_PROD: string;
  SWAP_API_BASE: string;
  SWAP_USER_IP: string;
  SWAP_DISABLE_APPS_INSTALL: boolean;
  MOCK_EXCHANGE_TEST_CONFIG: boolean;
  MOCK_EXCHANGE_TEST_PARTNER: boolean;
  EXPERIMENTAL_SWAP: boolean;
  BUY_API_BASE: string;
  SELL_API_BASE: string;
  PROVIDER_SESSION_ID_ENDPOINT: string;
  DETOX: string;
  PLAYWRIGHT_RUN: boolean;
  E2E_NANO_APP_VERSION_PATH: string;
  LEDGER_COUNTERVALUES_API: string;
  LEDGER_COUNTERVALUES_API_STAGING: string;
  DADA_API_STAGING: string;
  DADA_API_PROD: string;
  CMC_API_URL: string;
  COINGECKO_API_URL: string;
  MAPPING_SERVICE: string;
  MAX_ACCOUNT_NAME_SIZE: number;
  BIG_NUMBER_DECIMAL_PLACES: number;
  CRYPTO_ASSET_SEARCH_KEYS: string[];
  DEBUG_THEME: boolean;
  MOCK_COUNTERVALUES: string;
  HIDE_EMPTY_TOKEN_ACCOUNTS: boolean;
  SHOW_LEGACY_NEW_ACCOUNT: boolean;
  LW_ICONS_AVATARS_CDN_BASE_URL: string;
  EXPERIMENTAL_LANGUAGES: boolean;
  EXPERIMENTAL_ROI_CALCULATION: boolean;
  FEATURE_FLAGS: string;
}

export type EnvName = keyof EnvTypes;
export type EnvValue = EnvTypes[EnvName];

export const intParser = (v: any): number | undefined => {
  const n = parseInt(v, 10);
  if (!Number.isNaN(n)) return n;
};

export const floatParser = (v: any): number | undefined => {
  const n = parseFloat(v);
  if (!Number.isNaN(n)) return n;
};

export const boolParser = (v: unknown): boolean | undefined => {
  if (typeof v === "boolean") return v;
  return !(v === "0" || v === "false");
};

export const stringParser = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

export const jsonParser = (v: unknown): JSONValue | undefined => {
  try {
    if (typeof v !== "string") throw new Error();
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};

export const stringArrayParser = (v: unknown): string[] | undefined => {
  const v_array = typeof v === "string" ? v.split(",") : null;
  if (Array.isArray(v_array) && v_array.length > 0) return v_array;
};

export const getDefinition = (name: string): EnvDefRecord<unknown> | undefined =>
  configured().definitions[name] as EnvDefRecord<unknown> | undefined;

export const getAllEnvNames = (): string[] => Object.keys(configured().definitions);
export const getAllEnvs = (): Record<string, unknown> => ({ ...configured().env });

export function getEnv<K extends EnvName>(name: K): EnvTypes[K] {
  return configured().env[name] as EnvTypes[K];
}

export function getEnvDefault<K extends EnvName>(name: K): EnvTypes[K] {
  return configured().defaults[name] as EnvTypes[K];
}

export const isEnvDefault = (name: string): boolean => {
  const { env: e, defaults: d } = configured();
  return e[name] === d[name];
};

export const getEnvDesc = (name: string): string =>
  (configured().definitions as Record<string, { desc: string }>)[name]?.desc ?? "";

export function setEnv(name: string, value: unknown): void {
  const state = configured();
  const oldValue = state.env[name];
  if (oldValue !== value) {
    state.env[name] = value;
    notifyChange({ name, value, oldValue });
  }
}

export const setEnvUnsafe = (name: string, unsafeValue: unknown): boolean => {
  const definition = getDefinition(name);
  if (!definition) return false;
  const { parser } = definition;
  const value = parser(unsafeValue);

  if (value === undefined || value === null) {
    console.warn(`Invalid ENV value for ${name}`);
    return false;
  }

  setEnv(name, value);
  return true;
};
