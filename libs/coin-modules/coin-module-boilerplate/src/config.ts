import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-framework/config";

export type BoilerplateConfig = {
  nodeUrl: string;
  minReserve: number;
};

export type BoilerplateCoinConfig = CurrencyConfig & BoilerplateConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<BoilerplateCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => BoilerplateCoinConfig;
} = buildCoinConfig<BoilerplateCoinConfig>();

export default coinConfig;
