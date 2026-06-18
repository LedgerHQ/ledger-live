export const ALEO_DUMMY_ADDRESS = "aleo14pfq40wgltv8wrhsxqe5tlme4pkp448rfejfvqhd4yj0qycs7c9s2xkcwv";

export const PROGRAM_ID = {
  CREDITS: "credits.aleo",
};

export const EXPLORER_TRANSFER_TYPES = {
  PRIVATE: "transfer_private",
  PUBLIC: "transfer_public",
  PRIVATE_TO_PUBLIC: "transfer_private_to_public",
  PUBLIC_TO_PRIVATE: "transfer_public_to_private",
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

// Function names that represent actual private token transfers between parties.
// Used to exclude internal operations (split, join, fee_private, etc.) from history.
export const PRIVATE_TRANSFER_FUNCTIONS = new Set([
  EXPLORER_TRANSFER_TYPES.PRIVATE,
  EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
  EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
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

// Indexes based on aleo credits program args
// ref: https://developer.aleo.org/concepts/fundamentals/credits/#transfer_public
export const RECIPIENT_ARG_INDEX = 1;
export const AMOUNT_ARG_INDEX = 2;

// The maximum amount of records to fetch in a single API call when fetching owned records.
// This is not a limit on the total number of records that can be fetched, but rather a pagination parameter for the API calls.
export const DEFAULT_RECORDS_PAGE_SIZE = 1000;

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

// The maximum number of private records that can be included in a single transaction.
export const MAX_PRIVATE_RECORDS_PER_TRANSACTION = 14;

// Token batcher programs only support up to 13 records (no _14 variant exists).
export const MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION = 13;

// The estimated time in milliseconds it takes to sign a single record during transaction signing.
export const SINGLE_CALL_SIGNING_TIME = 12500;
