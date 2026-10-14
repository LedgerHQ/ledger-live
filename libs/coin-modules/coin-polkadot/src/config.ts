import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type PolkadotConfig = {
  node: {
    url: string;
    credentials?: string;
  };
  sidecar: {
    url: string;
    credentials?: string;
    /**
     * @default DEFAULT_MINIMUM_BOND_CACHE_TTL_MS (3600000)
     */
    minimumBondCacheTtlMs?: number;
    /**
     * @default DEFAULT_STAKING_PROGRESS_CACHE_TTL_MS (60000)
     */
    stakingProgressCacheTtlMs?: number;
    /**
     * @default DEFAULT_REGISTRY_CACHE_TTL_MS (3600000)
     */
    registryCacheTtlMs?: number;
    /**
     * @default DEFAULT_TRANSACTION_PARAMS_CACHE_TTL_MS (300000)
     */
    transactionParamsCacheTtlMs?: number;
    /**
     * @default DEFAULT_FEE_ESTIMATE_CACHE_TTL_MS (300000)
     */
    feeEstimateCacheTtlMs?: number;
    /**
     * @default DEFAULT_CONTROLLER_CACHE_TTL_MS (300000)
     */
    controllerCacheTtlMs?: number;
    /**
     * @default DEFAULT_ELECTION_STATUS_CACHE_TTL_MS (60000)
     */
    electionStatusCacheTtlMs?: number;
    /**
     * @default DEFAULT_NEW_ACCOUNT_CACHE_TTL_MS (60000)
     */
    newAccountCacheTtlMs?: number;
    /**
     * @default DEFAULT_CHAIN_CONSTANTS_CACHE_TTL_MS (3600000)
     */
    chainConstantsCacheTtlMs?: number;
    /**
     * @default DEFAULT_TRANSACTION_MATERIAL_CACHE_TTL_MS (3600000)
     */
    transactionMaterialCacheTtlMs?: number;
  };
  indexer: {
    url: string;
    /**
     * Page size of the operations queried from the indexer.
     * @default DEFAULT_MAX_TX_QUERY (200)
     */
    maxTxQuery?: number;
  };
  staking?: {
    /**
     * Blocks before the expected election change from which the election is considered open.
     * @default DEFAULT_ELECTION_STATUS_THRESHOLD (25)
     */
    electionStatusThreshold?: number;
  };
  validators?: {
    /**
     * @default DEFAULT_VALIDATORS_CACHE_TTL_MS (300000)
     */
    cacheTtlMs?: number;
    /**
     * @default DEFAULT_VALIDATORS_ADDRESSES_CACHE_TTL_MS (300000)
     */
    addressesCacheTtlMs?: number;
  };
  fees?: {
    /**
     * Raw amount kept spendable so that the next transactions can still pay their fees.
     * @default DEFAULT_FEES_SAFETY_BUFFER (1000000000)
     */
    safetyBuffer?: number;
  };
  hasBeenMigrated?: boolean;
};

export type PolkadotCoinConfig = CurrencyConfig & PolkadotConfig;

/** The {@link Context} threaded through the coin-polkadot bridge and Alpaca api layers (ADR-019). */
export type PolkadotContext = Context<PolkadotCoinConfig>;
