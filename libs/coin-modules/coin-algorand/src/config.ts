import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type AlgorandConfig = {
  node: string;
  indexer: string;
};

export type AlgorandCoinConfig = CurrencyConfig & AlgorandConfig;

const coinConfig = buildCoinConfig<AlgorandCoinConfig>();

export const setCoinConfig = coinConfig.setCoinConfig;
export const getCoinConfig = coinConfig.getCoinConfig;

export default coinConfig;
