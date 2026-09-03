import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type ConcordiumNetwork = "mainnet" | "testnet";

export type ConcordiumConfig = {
  networkType: ConcordiumNetwork;
  proxyUrl: string;
  minReserve: number;
  /**
   * Gates PLT token sub-accounts. Off means the wallet syncs exactly as it did
   * before tokens existed, so history and send validation can land behind it
   * without a user ever seeing a balance they cannot spend.
   */
  enableTokens: boolean;
};

export type ConcordiumCoinConfig = CurrencyConfig & ConcordiumConfig;

/**
 * The {@link Context} threaded through the coin-concordium API layer (ADR-019).
 *
 * The context carries `{ config, logger }`. Each API method resolves its coin configuration from
 * `context.config()` and threads it explicitly into the network/logic layers. The `currencyId`
 * used for chain selection is captured once from `createApi(currencyId)` and forwarded from the
 * API closure — it is not read off the context.
 */
export type ConcordiumContext = Context<ConcordiumCoinConfig>;
