import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-framework/errors";

export type VeChainCoinConfig = CurrencyConfig;

let coinConfig: CoinConfig<VeChainCoinConfig> | undefined;

export function setCoinConfig(config: CoinConfig<VeChainCoinConfig>): void {
  coinConfig = config;
}

export function getCoinConfig(): VeChainCoinConfig {
  if (!coinConfig) {
    throw new MissingCoinConfig();
  }

  return coinConfig();
}
