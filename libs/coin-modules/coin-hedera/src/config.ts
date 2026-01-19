import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export interface HederaConfig {
  useHgraphForErc20: boolean;
  /**
   * When true, the transaction valid-start time is sourced from the latest
   * network block instead of the local machine clock.
   */
  useNetworkTimestamp: boolean;
  networkType: "mainnet" | "testnet";
  apiUrls: {
    mirrorNode: string;
    hgraph: string;
  };
}

export type HederaCoinConfig = CurrencyConfig & HederaConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<HederaCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => HederaCoinConfig;
} = buildCoinConfig<HederaCoinConfig>();

export default coinConfig;
