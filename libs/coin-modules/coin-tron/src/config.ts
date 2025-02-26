import buildCoinConfig, { CoinConfig, type CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type TronConfig = {
  explorer: {
    url: string;
  };
};

export type TronCoinConfig = CurrencyConfig & TronConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<TronCoinConfig>) => void;
  getCoinConfig: (currency?: CryptoCurrency) => TronCoinConfig;
} = buildCoinConfig<TronCoinConfig>();

export default coinConfig;
