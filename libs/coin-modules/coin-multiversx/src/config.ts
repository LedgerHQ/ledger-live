import buildCoinConfig, {
  type CoinConfig,
  type Context,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type MultiversXConfig = {
  apiEndpoint: string;
  delegationApiEndpoint: string;
};

export type MultiversXCoinConfig = CurrencyConfig & MultiversXConfig;

/** The {@link Context} threaded through the coin-multiversx Alpaca api layer (ADR-019). */
export type MultiversXContext = Context<MultiversXCoinConfig>;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<MultiversXCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => MultiversXCoinConfig;
} = buildCoinConfig<MultiversXCoinConfig>();

export default coinConfig;

// Backward-compatible named exports used by the bridge path.
export const setCoinConfig = coinConfig.setCoinConfig.bind(coinConfig);
export const getCoinConfig = coinConfig.getCoinConfig.bind(coinConfig);
