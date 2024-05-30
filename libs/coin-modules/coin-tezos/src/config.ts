import buildConConfig, { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type TezosConfig = {
  explorer: {
    url: string;
  };
  node: {
    url: string;
  };
};

export type TezosCoinConfig = CurrencyConfig & TezosConfig;

const coinConfig = buildConConfig<TezosCoinConfig>();

export default coinConfig;
