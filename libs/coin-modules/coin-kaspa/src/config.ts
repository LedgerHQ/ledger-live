import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type KaspaCoinConfig = CurrencyConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<KaspaCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => KaspaCoinConfig;
} = buildCoinConfig<KaspaCoinConfig>();

export default coinConfig;
