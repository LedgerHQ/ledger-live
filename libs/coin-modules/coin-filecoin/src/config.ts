import buildCoinConfig, {
  type CoinConfig,
  type Context,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type FilecoinConfig = {
  infra?: {
    API_FILECOIN_ENDPOINT?: string;
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
