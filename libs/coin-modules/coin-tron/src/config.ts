import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type TronConfig = {
  explorer: {
    url: string;
  };
};

export type TronCoinConfig = CurrencyConfig & TronConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<TronCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => TronCoinConfig;
} = buildCoinConfig<TronCoinConfig>();

export default coinConfig;
