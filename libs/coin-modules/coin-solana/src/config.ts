import type { ValidatorsAppValidator } from "./network/validator-app";
import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type SolanaCurrencyId = "solana" | "solana_devnet" | "solana_testnet";

export type SolanaConfig = {
  token2022Enabled: boolean;
  legacyOCMSMaxVersion: string;
  rpcUrls: Partial<Record<SolanaCurrencyId, string>>;
  validatorsUrl?: string;
  staking?: {
    validatorsSummaryUrl?: string;
    /** Default validator first. @default DEFAULT_LEDGER_VALIDATORS */
    ledgerValidators?: ValidatorsAppValidator[];
  };
  broadcast?: {
    /** @default DEFAULT_BROADCAST_TIMEOUT_MS (100000) */
    timeoutMs?: number;
  };
  node?: {
    /** @default DEFAULT_NODE_RETRIES (3) */
    retries?: number;
    /** @default DEFAULT_NODE_RETRY_DELAY_MS (500) */
    retryDelayMs?: number;
    /** @default DEFAULT_NODE_MAX_TX_QUERY (100) */
    maxTxQuery?: number;
    /** @default DEFAULT_NODE_BATCH_SIZE (100) */
    batchSize?: number;
  };
  fees?: {
    /** @default DEFAULT_COMPUTE_UNIT_MARGIN (0.1) */
    computeUnitMargin?: number;
    /** @default DEFAULT_TX_FEE (5000) */
    defaultTxFee?: number;
    /** @default DEFAULT_BLOCKHASH_RETRIES (5) */
    blockhashRetries?: number;
    /** @default DEFAULT_BLOCKHASH_RETRY_DELAY_MS (5000) */
    blockhashRetryDelayMs?: number;
  };
  validators?: {
    /** @default DEFAULT_VALIDATORS_CACHE_TTL_MS (900000) */
    cacheTtlMs?: number;
  };
};

export type SolanaCoinConfig = CurrencyConfig & SolanaConfig;

/** The {@link Context} threaded through coin-solana (ADR-019). */
export type SolanaContext = Context<SolanaCoinConfig>;
