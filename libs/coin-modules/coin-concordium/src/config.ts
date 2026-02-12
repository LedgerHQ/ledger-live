import buildCoinConfig, { type CoinConfig } from "@ledgerhq/coin-framework/config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { ConcordiumCoinConfig } from "./types/config";

export type { ConcordiumCoinConfig } from "./types/config";

const coinConfig: {
  setCoinConfig: (config: CoinConfig<ConcordiumCoinConfig>) => void;
  getCoinConfig: (currency?: CryptoCurrency) => ConcordiumCoinConfig;
} = buildCoinConfig<ConcordiumCoinConfig>();

export default coinConfig;
