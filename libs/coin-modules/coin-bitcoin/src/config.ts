import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type BitcoinConfig = {
  /** Ledger explorer the module reads history, pendings and fee rates from and broadcasts to. */
  explorer: {
    url: string;
    /**
     * Transactions requested per explorer page, for history sync and pending transactions.
     * @default DEFAULT_EXPLORER_BATCH_SIZE (1000)
     */
    batchSize?: number;
  };
  /** Explorer id of the currency on the Ledger explorer; falls back to the currency id. */
  explorerId?: string;
  fees?: {
    /**
     * Age after which a pending outgoing operation is reported as stuck (offered for RBF).
     * @default DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS (1200000)
     */
    stuckTransactionTimeoutMs?: number;
    /**
     * Minimum fee-rate increase of an RBF replacement over the original, as a ratio.
     * @default DEFAULT_RBF_MIN_BUMP_RATIO (0.1)
     */
    rbfMinBumpRatio?: number;
    /**
     * Lifetime of a cached fee calculation (built transaction) for a given account and transaction.
     * @default DEFAULT_FEE_CALCULATION_CACHE_TTL_MS (300000)
     */
    calculationCacheTtlMs?: number;
    /**
     * Lifetime of the cached explorer fee rates of a currency.
     * @default DEFAULT_FEE_RATES_CACHE_TTL_MS (300000)
     */
    feeRatesCacheTtlMs?: number;
  };
  sync?: {
    /**
     * Age after which an unconfirmed operation is dropped from the synced history.
     * @default DEFAULT_REPLACED_OPERATION_EXPIRY_MS (7200000)
     */
    replacedOperationExpiryMs?: number;
  };
};

export type BitcoinCoinConfig = CurrencyConfig & BitcoinConfig;

/** The {@link Context} threaded through the coin-bitcoin bridge (ADR-019). */
export type BitcoinContext = Context<BitcoinCoinConfig>;
