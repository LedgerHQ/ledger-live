import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-framework/config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type XrpConfig = {
  node: string;
};

export type XrpCoinConfig = CurrencyConfig & XrpConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<XrpCoinConfig>) => void;
  getCoinConfig: (currency?: CryptoCurrency) => XrpCoinConfig;
} = buildCoinConfig<XrpCoinConfig>();

export default coinConfig;
