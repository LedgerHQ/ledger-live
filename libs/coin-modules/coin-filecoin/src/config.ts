import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type FilecoinCoinConfig = CurrencyConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<FilecoinCoinConfig>) => void;
  getCoinConfig: () => FilecoinCoinConfig;
} = buildCoinConfig<FilecoinCoinConfig>();

export default coinConfig;
