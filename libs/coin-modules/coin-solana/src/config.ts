import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type SolanaConfig = {
  token2022Enabled: boolean;
  queuedInterval: number;
};

export type SolanaCoinConfig = CurrencyConfig & SolanaConfig;

const coinConfig = buildCoinConfig<SolanaCoinConfig>();

export default coinConfig;
