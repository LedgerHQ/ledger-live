import type { ValidatorsAppValidator } from "./network/validator-app";

export const SOLANA_DUMMY_ADDRESS = "GjJyeC1r2RgkuoCWMyPYkCWSGSGLcz266EaAkLA27AhL";

export const DEFAULT_BROADCAST_TIMEOUT_MS = 100_000;
export const DEFAULT_NODE_RETRIES = 3;
export const DEFAULT_NODE_RETRY_DELAY_MS = 500;
export const DEFAULT_NODE_MAX_TX_QUERY = 100;
/** The RPC payload is capped near 50 KB. */
export const DEFAULT_NODE_BATCH_SIZE = 100;
export const DEFAULT_COMPUTE_UNIT_MARGIN = 0.1;
export const DEFAULT_TX_FEE = 5000;
export const DEFAULT_BLOCKHASH_RETRIES = 5;
export const DEFAULT_BLOCKHASH_RETRY_DELAY_MS = 5000;
export const DEFAULT_VALIDATORS_CACHE_TTL_MS = 15 * 60 * 1000;

// Hardcoding the Ledger validators info as backup,
// because backend is flaky and sometimes doesn't return it anymore
export const LEDGER_VALIDATOR_BY_FIGMENT: ValidatorsAppValidator = {
  voteAccount: "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx",
  name: "Ledger by Figment",
  avatarUrl:
    "https://s3.amazonaws.com/keybase_processed_uploads/3c47b62f3d28ecfd821536f69be82905_360_360.jpg",
  wwwUrl: "https://www.ledger.com/staking",
  activeStake: 8860644178046828,
  commission: 7,
  totalScore: 6,
  apy: 0.078107,
};

export const LEDGER_VALIDATOR_BY_BITWISE: ValidatorsAppValidator = {
  voteAccount: "CpfvLiiPALdzZTP3fUrALg2TXwEDSAknRh1sn5JCt9Sr",
  name: "Ledger by Bitwise",
  avatarUrl:
    "https://s3.amazonaws.com/keybase_processed_uploads/3c47b62f3d28ecfd821536f69be82905_360_360.jpg",
  wwwUrl: "https://www.ledger.com/staking",
  activeStake: 110738001000098,
  commission: 7,
  totalScore: 7,
  apy: 0.07228,
};

// default validator first
export const DEFAULT_LEDGER_VALIDATORS: ValidatorsAppValidator[] = [
  LEDGER_VALIDATOR_BY_FIGMENT,
  LEDGER_VALIDATOR_BY_BITWISE,
];
