import buildCoinConfig, {
  type CoinConfig,
  type Context,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type AlgorandConfig = {
  node: string;
  indexer: string;
};

export type AlgorandCoinConfig = CurrencyConfig & AlgorandConfig;

/** The {@link Context} threaded through the coin-algorand api layer (ADR-019). */
export type AlgorandContext = Context<AlgorandCoinConfig>;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<AlgorandCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => AlgorandCoinConfig;
} = buildCoinConfig<AlgorandCoinConfig>();

export const setCoinConfig = coinConfig.setCoinConfig;
export const getCoinConfig = coinConfig.getCoinConfig;

export default coinConfig;

export const algorandDefaults = {
  algorand: {
    status: {
      type: "active",
      features: [{ id: "blockchain_txs", status: "active" }],
    },
    name: "Algorand",
    unit: { name: "ALGO", code: "ALGO", magnitude: 6 },
  },
} satisfies Record<string, CurrencyConfig & Partial<AlgorandCoinConfig>>;
