import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type InternetComputerConfig = {
  infra: {
    /** IC boundary node every query, update and read_state call goes through. */
    ICP_NETWORK_URL: string;
  };
};

export type InternetComputerCoinConfig = CurrencyConfig & InternetComputerConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<InternetComputerCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => InternetComputerCoinConfig;
} = buildCoinConfig<InternetComputerCoinConfig>();

export const setCoinConfig = coinConfig.setCoinConfig;
export const getCoinConfig = coinConfig.getCoinConfig;

export default coinConfig;
