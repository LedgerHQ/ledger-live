import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type CardanoConfig = {
  maxFeesWarning: number;
  maxFeesError: number;
};

export type CardanoCoinConfig = CurrencyConfig & CardanoConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<CardanoCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => CardanoCoinConfig;
} = buildCoinConfig<CardanoCoinConfig>();

export default coinConfig;
