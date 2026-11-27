import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type ConcordiumNetwork = "mainnet" | "testnet";

export type ConcordiumConfig = {
  networkType: ConcordiumNetwork;
  proxyUrl: string;
  /** Microccd kept out of the spendable balance. */
  minReserve: number;
  /**
   * Gates PLT token sub-accounts. Off means the wallet syncs exactly as it did
   * before tokens existed, so history and send validation can land behind it
   * without a user ever seeing a balance they cannot spend.
   */
  enableTokens: boolean;
  gateway: {
    timeoutMs: number;
    retries: number;
    retryDelayMs: number;
    /** Page size of the bridge history walk. The proxy clamps anything larger to 1000. */
    maxTxQuery: number;
    pltModuleStateCacheTtlMs: number;
    accountTokensCacheTtlMs: number;
  };
  fees: {
    /** Fee in microCCD returned when the proxy cannot estimate a CCD transfer. */
    defaultCost: number;
    /**
     * Buffer added to the energy of a PLT fee estimate, as a percentage. The fee is then priced
     * from the buffered energy. Energy is a ceiling, not a charge: the chain bills actual
     * execution, so the buffer costs nothing while absorbing drift before submission.
     */
    pltEnergyBufferPercent: number;
  };
  tokens: {
    calLookupConcurrency: number;
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
    projectId: string;
  };
};

/**
 * The {@link Context} threaded through the coin-concordium bridge and API layers (ADR-019).
 *
 * It is the injection argument of the bridge, logic and network layers. Each function reads the
 * coin configuration from `context.config()` at call time and logs through `context.logger`.
 * WalletConnect is the exception: the apps create it without a context, so pairing passes it the
 * settings and the logger.
 */
export type ConcordiumContext = Context<ConcordiumCoinConfig>;

export type ConcordiumBridgeContext = Context<ConcordiumBridgeConfig>;

/**
 * Pins `context` to one resolved `config`, whatever currency id a consumer asks for.
 *
 * Use it where one operation must see a single configuration, and before handing a context to a
 * layer that calls `context.config()` without a currency id.
 */
export const withConfig = <C extends ConcordiumCoinConfig>(
  context: Context<C>,
  config: C,
): Context<C> => ({ ...context, config: async () => config });
