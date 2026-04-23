import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type HederaConfig = {
  useHgraphForErc20: boolean;
  /**
   * When true, the transaction valid-start time is sourced from the latest
   * network block instead of the local machine clock.
   */
  useNetworkTimestamp: boolean;
};

export type HederaCoinConfig = CurrencyConfig & HederaConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<HederaCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => HederaCoinConfig;
} = buildCoinConfig<HederaCoinConfig>();

export default coinConfig;
