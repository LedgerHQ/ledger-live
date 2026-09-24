import buildCoinConfig, {
  type CoinConfig,
  type Context,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type AlgorandConfig = {
  infra: {
    API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT: string;
  };
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
