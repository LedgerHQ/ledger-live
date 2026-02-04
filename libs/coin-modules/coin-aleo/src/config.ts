import type { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import buildCoinConfig from "@ledgerhq/coin-framework/config";
import type { TRANSACTION_TYPE } from "./constants";

export type AleoConfig = {
  networkType: "mainnet" | "testnet";
  apiUrls: {
    node: string;
    sdk: string;
  };
  feesByTransactionType: Record<TRANSACTION_TYPE, number>;
  estimatedFeeSafetyRate: number;
};

export type AleoCoinConfig = CurrencyConfig & AleoConfig;

const coinConfig = buildCoinConfig<AleoCoinConfig>();

export default coinConfig;
