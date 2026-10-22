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
  /**
   * How the currency's transactions are built and signed by its Ledger app, read by the coin module
   * API. Absent: a Bitcoin-format transaction, version 1, final inputs.
   */
  transaction?: {
    /**
     * Transaction version: 2 for the currencies signed by app-bitcoin-new (hw-app-btc `BtcNew`),
     * which build version 2 transactions; 1 for every other app.
     * @default 1
     */
    version?: 1 | 2;
    /** Inputs signal replace-by-fee (BIP 125). @default false */
    signalsRbf?: boolean;
    /**
     * The format carries an expiry height (Komodo, Decred): not Bitcoin serialization, which
     * bitcoinjs-lib cannot write, so the transaction is crafted as a signing request instead of a
     * PSBT, and hw-app-btc serializes it.
     * @default false
     */
    expiryHeight?: boolean;
    /** Previous transactions carry data after the locktime (hw-app-btc `splitTransaction`). */
    extraData?: boolean;
    /**
     * The locktime is the signing time minus 777 s, which lets Komodo outputs claim their interest.
     * @default false
     */
    interestLockTime?: boolean;
    /** hw-app-btc format flags (`additionals`) beyond the currency id and address type. */
    additionals?: string[];
  };
  /**
   * The currency's address format when it is not Bitcoin's. Only `"cashaddr"` (Bitcoin Cash) changes
   * anything: the explorer is then queried with the `bitcoincash:` form, and the Ledger app told the
   * recipient's format. Any other value is read as Bitcoin's format.
   */
  addressFormat?: string;
};

export type BitcoinCoinConfig = CurrencyConfig & BitcoinConfig;

/** The {@link Context} threaded through the coin-bitcoin bridge (ADR-019). */
export type BitcoinContext = Context<BitcoinCoinConfig>;
