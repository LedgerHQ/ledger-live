import buildCoinConfig, {
  type CoinConfig,
  type Context,
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

/** The {@link Context} threaded through the coin-polkadot Alpaca api layer (ADR-019). */
export type PolkadotContext = Context<PolkadotCoinConfig>;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<PolkadotCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => PolkadotCoinConfig;
} = buildCoinConfig<PolkadotCoinConfig>();

export default coinConfig;
