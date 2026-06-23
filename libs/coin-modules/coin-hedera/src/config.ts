import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export interface HederaConfig {
  /**
   * When true, the transaction valid-start time is sourced from the latest
   * network block instead of the local machine clock.
   */
  useNetworkTimestamp: boolean;
  networkType: "mainnet" | "testnet";
  sdkClientOptions?: {
    maxAttempts?: number;
    requestTimeout?: number;
    minBackoff?: number;
    maxBackoff?: number;
  };
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
