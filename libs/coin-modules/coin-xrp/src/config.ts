import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-framework/config";

export type XrpConfig = {
  node: string;
};

export type XrpCoinConfig = CurrencyConfig & XrpConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<XrpCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => XrpCoinConfig;
} = buildCoinConfig<XrpCoinConfig>();

export default coinConfig;
