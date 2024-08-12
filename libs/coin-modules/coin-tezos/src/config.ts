import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

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
    minStorageLimit: number;
    minFees: number;
    minEstimatedFees: number;
  };
};

export type TezosCoinConfig = CurrencyConfig & TezosConfig;

const coinConfig = buildConConfig<TezosCoinConfig>();

export default coinConfig;
