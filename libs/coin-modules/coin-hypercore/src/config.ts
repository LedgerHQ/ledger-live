import buildCoinConfig, {
  CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

/** Public Hyperliquid mainnet info endpoint — used as a sensible default when no remote config is present. */
export const DEFAULT_HYPERCORE_INFO_URL = "https://api.hyperliquid.xyz/info";

export type HyperCoreConfig = {
  infoUrl: string;
};

export type HyperCoreCoinConfig = CurrencyConfig & HyperCoreConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<HyperCoreCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => HyperCoreCoinConfig;
} = buildCoinConfig<HyperCoreCoinConfig>();

export default coinConfig;
