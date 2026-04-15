import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-module-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-module-framework/errors";

export type VechainCoinConfig = () => CurrencyConfig;

let coinConfig: CoinConfig<CurrencyConfig> | undefined;

export function setCoinConfig(config: CoinConfig<CurrencyConfig>): void {
  coinConfig = config;
}

export function getCoinConfig(): CurrencyConfig {
  if (!coinConfig) {
    throw new MissingCoinConfig();
  }

  return coinConfig();
}
