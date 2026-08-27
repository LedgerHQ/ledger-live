export const ALEO_DUMMY_ADDRESS = "aleo14pfq40wgltv8wrhsxqe5tlme4pkp448rfejfvqhd4yj0qycs7c9s2xkcwv";

export const PROGRAM_ID = {
  CREDITS: "credits.aleo",
  TOKEN_REGISTRY: "token_registry.aleo",
};

export const EXPLORER_TRANSFER_TYPES = {
  PRIVATE: "transfer_private",
  PUBLIC: "transfer_public",
  PRIVATE_TO_PUBLIC: "transfer_private_to_public",
  PUBLIC_TO_PRIVATE: "transfer_public_to_private",
  FEE_PRIVATE: "fee_private",
};

export const TRANSACTION_TYPE = {
  TRANSFER_PUBLIC: "transfer_public",
  TRANSFER_PRIVATE: "transfer_private",
  CONVERT_PUBLIC_TO_PRIVATE: "convert_public_to_private",
  CONVERT_PRIVATE_TO_PUBLIC: "convert_private_to_public",
  TRANSFER_TOKEN_PUBLIC: "transfer_token_public",
  TRANSFER_TOKEN_PRIVATE: "transfer_token_private",
  CONVERT_TOKEN_PRIVATE_TO_PUBLIC: "convert_token_private_to_public",
  CONVERT_TOKEN_PUBLIC_TO_PRIVATE: "convert_token_public_to_private",
} as const;

export const FEE_INTENT_TYPES = new Set(["fee_public", "fee_private"]);

// Function names that represent actual private token transfers between parties.
// Used to exclude internal operations (split, join, fee_private, etc.) from history.
export const PRIVATE_TRANSFER_FUNCTIONS = new Set([
  EXPLORER_TRANSFER_TYPES.PRIVATE,
  EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
  EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
]);

// Functions that produce owned records without transferring anything,
// so their transition holds no recipient and no amount.
export const NON_TRANSFER_FUNCTIONS = new Set([
  "join",
  "split",
  EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
]);

// Semi-public function names that cross the public/private boundary.
// These appear in public token operations AND have matching private records,
// so they need to be patched during private sync (analogous to coin ops patching).
export const SEMI_PUBLIC_TOKEN_FUNCTIONS = new Set([
  EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
  EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
]);

// Each record with this value in `record_name` field is a token record.
export const TOKEN_RECORD_NAME = "Token";

// The maximum amount of records to fetch in a single API call when fetching owned records.
// This is not a limit on the total number of records that can be fetched, but rather a pagination parameter for the API calls.
export const DEFAULT_RECORDS_PAGE_SIZE = 1000;

// Pagination parameter for GET /tokens calls when fetching the full token registry.
export const DEFAULT_TOKENS_PAGE_SIZE = 1000;

// Hard cap of the explorer's public transitions endpoint — above it, 400 "Limit must be between 1
// and 50". Counts transitions, not transactions: one transaction can span several rows.
export const MAX_TRANSITIONS_PER_PAGE = 50;

/**
 * Progress phase boundaries for private sync.
 *
 * Phase 1 (PROGRESS_AFTER_SCANNER):          0 → 30   — record scanner / fetch stage
 * Phase 2 (PROGRESS_AFTER_LIST_OPS):        30 → 65   — listing / decoding private operations (35 pts)
 * Phase 3 (PROGRESS_AFTER_PARSING_RECORDS): 65 → 95   — parsing records / computing private balance (30 pts)
 * Done:                                        100
 */
export const PROGRESS_AFTER_SCANNER = 30;
export const PROGRESS_AFTER_LIST_OPS = PROGRESS_AFTER_SCANNER + 35; // 65
export const PROGRESS_AFTER_PARSING_RECORDS = 30; // 65 → 95
export const PROGRESS_DONE = 100;
export const PROGRESS_THROTTLE_MIN_STEP = 5;

// Root transition + up to 30 nested calls, within the device limit of n < 32 per signing session.
export const MAX_SIGNATURES_PER_TRANSACTION = 31;

// The maximum number of private records that can be included in a single transaction.
export const MAX_PRIVATE_RECORDS_PER_TRANSACTION = 14;

// Token batcher programs only support up to 13 records (no _14 variant exists).
export const MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION = 13;

// The record-count boundary between the "Fast" and "Balanced" quick-amount tiers.
export const FAST_PRIVATE_RECORDS_PER_TRANSACTION = 4;
// The record-count boundary between the "Balanced" and "Full" quick-amount tiers.
export const BALANCED_PRIVATE_RECORDS_PER_TRANSACTION = 8;

// The estimated time in milliseconds it takes to sign a single record during transaction signing.
export const SINGLE_CALL_SIGNING_TIME = 12500;

export const MICROCREDITS_PER_CREDIT = 1_000_000;

// Below this bonded total the protocol pays a delegator nothing at all.
export const MIN_DELEGATOR_STAKE_MICROCREDITS = 10_000 * MICROCREDITS_PER_CREDIT;

// snarkVM `block_reward_v2` adds a coinbase share and transaction fees on top, so
// rates derived from this alone are a lower bound.
export const ANNUAL_INFLATION_RATE = 0.05;

// A validator above this share of total stake earns zero, not a reduced rate.
export const MAX_VALIDATOR_STAKE_SHARE = 0.25;
