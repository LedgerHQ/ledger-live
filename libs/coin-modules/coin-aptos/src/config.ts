import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type Config = {
  node: string;
};

export type CoinConfig = CurrencyConfig & Config;

const coinConfig = buildConConfig<CoinConfig>();

export default coinConfig;
