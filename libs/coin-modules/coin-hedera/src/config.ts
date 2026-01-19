import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export interface HederaConfig {
  networkType: "mainnet" | "testnet";
  apiUrls: {
    mirrorNode: string;
    hgraph: string;
  };
}

export type HederaCoinConfig = CurrencyConfig & HederaConfig;

const coinConfig = buildCoinConfig<HederaCoinConfig>();

export default coinConfig;
