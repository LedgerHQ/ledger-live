import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type ConcordiumNetwork = "mainnet" | "testnet";

export type ConcordiumConfig = {
  networkType: ConcordiumNetwork;
  proxyUrl: string;
  /**
   * @default DEFAULT_MIN_RESERVE (0)
   */
  minReserve?: number;
  /**
   * Gates PLT token sub-accounts. Off means the wallet syncs exactly as it did
   * before tokens existed, so history and send validation can land behind it
   * without a user ever seeing a balance they cannot spend.
   * @default DEFAULT_ENABLE_TOKENS (false)
   */
  enableTokens?: boolean;
  gateway?: {
    /**
     * @default DEFAULT_GATEWAY_TIMEOUT_MS (30000)
     */
    timeoutMs?: number;
    /**
     * @default DEFAULT_GATEWAY_RETRIES (2)
     */
    retries?: number;
    /**
     * @default DEFAULT_GATEWAY_RETRY_DELAY_MS (1000)
     */
    retryDelayMs?: number;
    /**
     * Page size of the bridge history walk. The proxy clamps anything larger to 1000.
     * @default DEFAULT_MAX_TX_QUERY (1000)
     */
    maxTxQuery?: number;
    /**
     * @default DEFAULT_PLT_MODULE_STATE_CACHE_TTL_MS (300000)
     */
    pltModuleStateCacheTtlMs?: number;
    /**
     * @default DEFAULT_ACCOUNT_TOKENS_CACHE_TTL_MS (30000)
     */
    accountTokensCacheTtlMs?: number;
  };
  fees?: {
    /**
     * Fee in microCCD returned when the proxy cannot estimate a CCD transfer.
     * @default DEFAULT_FEES_DEFAULT_COST (1000000)
     */
    defaultCost?: number;
    /**
     * @default DEFAULT_PLT_ENERGY_BUFFER_PERCENT (20)
     */
    pltEnergyBufferPercent?: number;
  };
  tokens?: {
    /**
     * @default DEFAULT_CAL_LOOKUP_CONCURRENCY (4)
     */
    calLookupConcurrency?: number;
  };
  /** Supplied by coin-service; no reader in this module. */
  grpcUrl?: string;
  /** Supplied by coin-service; no reader in this module. */
  grpcPort?: number;
};

export type ConcordiumCoinConfig = CurrencyConfig & ConcordiumConfig;

/** The bridge also onboards through WalletConnect; the Alpaca API never reads the relay. */
export type ConcordiumBridgeConfig = ConcordiumCoinConfig & {
  walletConnect: {
    relayUrl: string;
  };
};

/**
 * The {@link Context} threaded through the coin-concordium bridge and API layers (ADR-019).
 *
 * Each consumer resolves its coin configuration from `context.config()` at call time and threads
 * it explicitly into the network/logic layers.
 */
export type ConcordiumContext = Context<ConcordiumCoinConfig>;

export type ConcordiumBridgeContext = Context<ConcordiumBridgeConfig>;
