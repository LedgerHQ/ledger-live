import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import type { RecordPickingStrategy, TransactionType } from "./logic";

export type AleoConfig = {
  networkType: "mainnet" | "testnet";
  apiUrls: {
    node: string;
    sdk: string;
  };
  feeByTransactionType: Record<TransactionType, number>;
  feeSafetyMultiplier: number;
  isFeeSponsored: boolean;
  enableTokens: boolean;
  useEncryptedProve: boolean;
  recordPickingStrategy: RecordPickingStrategy;
};

export type AleoCoinConfig = CurrencyConfig & AleoConfig;

/**
 * The {@link Context} threaded through the coin-aleo low layers (ADR-019).
 *
 * The free-form `Record` part carries a `currencyId` needed by some methods (e.g. listOperations).
 *
 * `provableId` + `viewKey` (ADR-042) opt `listOperations` into the merged public + private path.
 * They must be supplied together; the caller owns their custody and persistence.
 */
export type AleoContext = Context<AleoCoinConfig> & {
  provableId?: string;
  viewKey?: string;
};
