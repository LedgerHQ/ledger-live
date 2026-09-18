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
  /**
   * Dedicated node for staking-pallet storage reads, used when the currency's own node no
   * longer exposes `api.query.staking` (e.g. Westend's staking pallet migrated to its Asset Hub).
   */
  assetHub?: {
    nodeUrl: string;
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
