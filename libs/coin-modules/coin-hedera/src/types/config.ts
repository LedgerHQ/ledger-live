import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export interface HederaConfig {
  /**
   * When true, the transaction valid-start time is sourced from the latest
   * network block instead of the local machine clock.
   */
  useNetworkTimestamp: boolean;
  networkType: "mainnet" | "testnet";
  /** Dead address that receives 1 tinybar from the transaction used to trigger a rewards claim. */
  claimRewardsRecipient: string;
  /** Consensus node run by Ledger, listed first and pre-selected when delegating. `-1` when there is none. */
  ledgerNodeId: number;
  /** Minimum USD worth an account must hold to associate a token. */
  tokenAssociationMinUsd: number;
  sdkClientOptions?: {
    maxAttempts?: number;
    requestTimeout?: number;
    minBackoff?: number;
    maxBackoff?: number;
  };
  apiUrls: {
    mirrorNode: string;
    hgraph: string;
  };
}

export type HederaCoinConfig = CurrencyConfig & HederaConfig;

/** The {@link Context} threaded through the coin-hedera low layers (ADR-019). */
export type HederaContext = Context<HederaCoinConfig>;
