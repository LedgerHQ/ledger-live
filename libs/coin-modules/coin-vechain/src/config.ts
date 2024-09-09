import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-framework/errors";

export type VechainCoinConfig = () => CurrencyConfig

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
