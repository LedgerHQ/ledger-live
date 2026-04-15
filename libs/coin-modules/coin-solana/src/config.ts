import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type SolanaConfig = {
  token2022Enabled: boolean;
  legacyOCMSMaxVersion: string;
};

export type SolanaCoinConfig = CurrencyConfig & SolanaConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<SolanaCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => SolanaCoinConfig;
} = buildCoinConfig<SolanaCoinConfig>();

export default coinConfig;
