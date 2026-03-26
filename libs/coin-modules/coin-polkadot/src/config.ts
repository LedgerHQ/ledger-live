import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type PolkadotConfig = {
  node: {
    url: string;
    credentials?: string;
  };
  sidecar: {
    url: string;
    credentials?: string;
  };
  indexer: {
    url: string;
  };
  staking?: {
    electionStatusThreshold: number;
  };
};

export type PolkadotCoinConfig = CurrencyConfig & PolkadotConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<PolkadotCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => PolkadotCoinConfig;
} = buildCoinConfig<PolkadotCoinConfig>();

export default coinConfig;
