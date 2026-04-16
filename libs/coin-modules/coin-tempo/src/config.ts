import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type TempoConfig = {
  rpcUrl: string;
};

export type TempoCoinConfig = CurrencyConfig & TempoConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<TempoCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => TempoCoinConfig;
} = buildCoinConfig<TempoCoinConfig>();

export default coinConfig;
