import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export interface HederaConfig {
  /** When true, valid-start time comes from the latest network block instead of the local clock. */
  useNetworkTimestamp: boolean;
  networkType: "mainnet" | "testnet";
  /**
   * Overrides the consensus gRPC topology (`Client.forNetwork` shape: `"host:port" → "0.0.x"`),
   * e.g. to point at a local Solo deploy. `networkType` still governs mirror node behavior.
   */
  consensusNodes?: Record<string, string>;
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
