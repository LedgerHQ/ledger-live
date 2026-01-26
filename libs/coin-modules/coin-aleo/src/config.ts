import type { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import buildCoinConfig from "@ledgerhq/coin-framework/config";

export type AleoConfig = {
  networkType: "mainnet" | "testnet";
  apiUrls: {
    node: string;
    sdk: string;
  };
};

export type AleoCoinConfig = CurrencyConfig & AleoConfig;

const coinConfig = buildCoinConfig<AleoCoinConfig>();

export default coinConfig;
