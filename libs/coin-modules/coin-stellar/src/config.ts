import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-framework/errors";

export type StellarConfig = unknown;

export type StellarCoinConfig = CurrencyConfig & StellarConfig;

let coinConfig: CoinConfig<StellarCoinConfig> | undefined;

export function setCoinConfig(config: CoinConfig<StellarCoinConfig>): void {
  coinConfig = config;
}

export function getCoinConfig(): StellarCoinConfig {
  if (!coinConfig) {
    throw new MissingCoinConfig();
  }

  return coinConfig();
}
