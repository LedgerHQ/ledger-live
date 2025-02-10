import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type TronConfig = {
  explorer: {
    url: string;
  };
};

export type TronCoinConfig = CurrencyConfig & TronConfig;

const coinConfig = buildCoinConfig<TronCoinConfig>();

export default coinConfig;
