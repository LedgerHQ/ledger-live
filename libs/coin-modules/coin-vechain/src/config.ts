import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-module-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-module-framework/errors";

export type VechainCoinConfig = () => CurrencyConfig;

declare global {
  var __ledgerCoinConfig_vechain: CoinConfig<CurrencyConfig> | undefined;
}

export function setCoinConfig(config: CoinConfig<CurrencyConfig>): void {
  globalThis.__ledgerCoinConfig_vechain = config;
}

export function getCoinConfig(): CurrencyConfig {
  if (!globalThis.__ledgerCoinConfig_vechain) {
    throw new MissingCoinConfig();
  }

  return globalThis.__ledgerCoinConfig_vechain();
}
