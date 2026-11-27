import buildCoinConfig, {
  type CoinConfig,
  type Context,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type FilecoinConfig = {
  infra?: {
    API_FILECOIN_ENDPOINT?: string;
  };
  indexer: {
    url: string;
    maxPage: number;
  };
  /** A Lotus node that serves the JSON-RPC API v2, with F3 finality (Lotus v1.33 or later) */
  node: {
    url: string;
  };
};

export type FilecoinCoinConfig = CurrencyConfig & FilecoinConfig;

/** The {@link Context} threaded through the coin-filecoin Alpaca api layer (ADR-019). */
export type FilecoinContext = Context<FilecoinCoinConfig>;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<FilecoinCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => FilecoinCoinConfig;
} = buildCoinConfig<FilecoinCoinConfig>();

export default coinConfig;

export const filecoinDefaults = {
  filecoin: {
    status: {
      type: "active",
      features: [{ id: "blockchain_txs", status: "active" }],
    },
    name: "Filecoin",
    unit: { name: "FIL", code: "FIL", magnitude: 18 },
    indexer: { url: "https://proxyblockscout.api.live.ledger.com/314/api/v2", maxPage: 100 },
    node: { url: "https://api.node.glif.io/rpc/v2" },
  },
} satisfies Record<string, FilecoinCoinConfig>;
