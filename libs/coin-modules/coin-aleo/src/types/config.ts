import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import type { TransactionType } from "./logic";

export type AleoConfig = {
  networkType: "mainnet" | "testnet";
  apiUrls: {
    node: string;
    sdk: string;
  };
  feeByTransactionType: Record<TransactionType, number>;
  feeSafetyMultiplier: number;
  isFeeSponsored: boolean;
  useEncryptedProve: boolean;
};

export type AleoCoinConfig = CurrencyConfig & AleoConfig;
