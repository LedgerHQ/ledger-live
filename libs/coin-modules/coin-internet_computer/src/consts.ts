// Transaction types
export const ICP_SEND_TXN_TYPE = 0;
export const ICP_LIST_NEURONS_TXN_TYPE = 1;

// API limits
export const FETCH_TXNS_LIMIT = 100;

// Last sync threshold
export const LAST_SYNC_THRESHOLD_IN_DAYS = 14;

// Max Memo value on ICP network
export const MAX_MEMO_VALUE = Number.MAX_SAFE_INTEGER;

export {
  // Neuron constants
  KNOWN_TOPICS,
  KNOWN_NEURON_IDS,
  // Dissolve delay constants
  MIN_DISSOLVE_DELAY,
  MAX_DISSOLVE_DELAY,
  // Time constants
  SECONDS_IN_MINUTE,
  MINUTES_IN_HOUR,
  HOURS_IN_DAY,
  SECONDS_IN_HOUR,
  SECONDS_IN_DAY,
  SECONDS_IN_YEAR,
  SECONDS_IN_HALF_YEAR,
  SECONDS_IN_FOUR_YEARS,
  SECONDS_IN_EIGHT_YEARS,
  // Canister ids
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAINNET_LEDGER_CANISTER_ID,
  MAINNET_INDEX_CANISTER_ID,
  // Network constants
  ICP_NETWORK_URL,
  ICP_MIN_STAKING_AMOUNT,
  ICP_FEES,
  E8S_PER_ICP,
  // Default ingress expiry delta in milliseconds
  DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS,
  // Voting power refresh threshold
} from "@zondax/ledger-live-icp/neurons";
