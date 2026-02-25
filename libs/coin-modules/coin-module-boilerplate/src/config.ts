import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-framework/config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type BoilerplateConfig = {
  nodeUrl: string;
  minReserve: number;
};

export type BoilerplateCoinConfig = CurrencyConfig & BoilerplateConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<BoilerplateCoinConfig>) => void;
  getCoinConfig: (currency?: CryptoCurrency) => BoilerplateCoinConfig;
} = buildCoinConfig<BoilerplateCoinConfig>();

export default coinConfig;
