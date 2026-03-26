import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type AlgorandConfig = {
  node: string;
  indexer: string;
};

export type AlgorandCoinConfig = CurrencyConfig & AlgorandConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<AlgorandCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => AlgorandCoinConfig;
} = buildCoinConfig<AlgorandCoinConfig>();

export const setCoinConfig = coinConfig.setCoinConfig;
export const getCoinConfig = coinConfig.getCoinConfig;

export default coinConfig;
