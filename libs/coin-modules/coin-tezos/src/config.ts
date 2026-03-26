import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type TezosConfig = {
  baker: {
    url: string;
  };
  explorer: {
    url: string;
    maxTxQuery: number;
  };
  node: {
    url: string;
  };
  fees: {
    minGasLimit: number;
    minRevealGasLimit: number;
    minStorageLimit: number;
    minFees: number;
    minEstimatedFees: number;
  };
};

export type TezosCoinConfig = CurrencyConfig & TezosConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<TezosCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => TezosCoinConfig;
} = buildCoinConfig<TezosCoinConfig>();

export default coinConfig;
