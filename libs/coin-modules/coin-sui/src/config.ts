import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type SuiConfig = {
  status: {
    type: "active";
  };
};

export type SuiCoinConfig = CurrencyConfig & SuiConfig;

type CoinConfigType = {
  setCoinConfig: (config: (currency?: CryptoCurrency) => SuiCoinConfig) => void;
  getCoinConfig: (currency?: CryptoCurrency) => SuiCoinConfig;
};

const coinConfig: CoinConfigType = buildConConfig<SuiCoinConfig>();

export default coinConfig;
