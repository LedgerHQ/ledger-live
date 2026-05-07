import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
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
