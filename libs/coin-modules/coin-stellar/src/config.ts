import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-framework/config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type StellarConfig = {
  explorer: {
    url: string;
    fetchLimit?: number;
  };
  useStaticFees?: boolean;
  enableNetworkLogs?: boolean;
};

export type StellarCoinConfig = CurrencyConfig & StellarConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<StellarCoinConfig>) => void;
  getCoinConfig: (currency?: CryptoCurrency) => StellarCoinConfig;
} = buildCoinConfig<StellarCoinConfig>();

export default coinConfig;
