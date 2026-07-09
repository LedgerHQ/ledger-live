import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type MultiversXConfig = {
  apiEndpoint: string;
  delegationApiEndpoint: string;
};

export type MultiversXCoinConfig = CurrencyConfig & MultiversXConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<MultiversXCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => MultiversXCoinConfig;
} = buildCoinConfig<MultiversXCoinConfig>();

export default coinConfig;

// Backward-compatible named exports used by the bridge path.
export const setCoinConfig = coinConfig.setCoinConfig.bind(coinConfig);
export const getCoinConfig = coinConfig.getCoinConfig.bind(coinConfig);
