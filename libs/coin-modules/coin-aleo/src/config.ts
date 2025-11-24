import type { CoinConfig, CurrencyConfig } from "@ledgerhq/coin-framework/config";
import buildCoinConfig from "@ledgerhq/coin-framework/config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

// TODO: replace with proper config
// eslint-disable-next-line @typescript-eslint/ban-types
export type AleoConfig = {};

export type AleoCoinConfig = CurrencyConfig & AleoConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<AleoCoinConfig>) => void;
  getCoinConfig: (currency?: CryptoCurrency) => AleoCoinConfig;
} = buildCoinConfig<AleoCoinConfig>();

export default coinConfig;
