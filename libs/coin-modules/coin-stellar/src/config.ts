import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-framework/config";

export type StellarConfig = {
  explorer: {
    url: string;
    fetchLimit?: number;
  };
  useStaticFees?: boolean;
  enableNetworkLogs?: boolean;
};

export type StellarCoinConfig = CurrencyConfig & StellarConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<StellarCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => StellarCoinConfig;
} = buildCoinConfig<StellarCoinConfig>();

export default coinConfig;
