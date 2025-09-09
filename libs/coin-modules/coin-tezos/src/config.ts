import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-framework/config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

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
  getCoinConfig: (currency?: CryptoCurrency) => TezosCoinConfig;
} = buildCoinConfig<TezosCoinConfig>();

export default coinConfig;
