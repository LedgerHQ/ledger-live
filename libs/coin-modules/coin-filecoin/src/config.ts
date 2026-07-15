import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type FilecoinConfig = {
  infra?: {
    API_FILECOIN_ENDPOINT?: string;
  };
};

export type FilecoinCoinConfig = CurrencyConfig & FilecoinConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<FilecoinCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => FilecoinCoinConfig;
} = buildCoinConfig<FilecoinCoinConfig>();

export default coinConfig;
