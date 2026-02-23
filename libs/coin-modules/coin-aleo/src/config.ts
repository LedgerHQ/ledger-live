import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";
import type { TransactionType } from "./types";

export type AleoConfig = {
  networkType: "mainnet" | "testnet";
  apiUrls: {
    node: string;
    sdk: string;
  };
  feeByTransactionType: Record<TransactionType, number>;
  feeSafetyMultiplier: number;
};

export type AleoCoinConfig = CurrencyConfig & AleoConfig;

const coinConfig = buildCoinConfig<AleoCoinConfig>();

export default coinConfig;
