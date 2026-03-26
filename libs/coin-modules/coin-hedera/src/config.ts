import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type HederaConfig = {
  useHgraphForErc20: boolean;
};

export type HederaCoinConfig = CurrencyConfig & HederaConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<HederaCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => HederaCoinConfig;
} = buildCoinConfig<HederaCoinConfig>();

export default coinConfig;
