import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-module-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-module-framework/errors";
import { MAINNET_CHAIN_TAG } from "./types";

export type VechainCurrencyConfig = CurrencyConfig & { chainTag?: number };

export type VechainCoinConfig = () => VechainCurrencyConfig;

let coinConfig: CoinConfig<VechainCurrencyConfig> | undefined;

export function setCoinConfig(config: CoinConfig<VechainCurrencyConfig>): void {
  coinConfig = config;
}

export function getCoinConfig(): VechainCurrencyConfig {
  if (!coinConfig) {
    throw new MissingCoinConfig();
  }

  return coinConfig();
}

export function getChainTag(): number {
  const { chainTag } = getCoinConfig();
  return typeof chainTag === "number" &&
    Number.isInteger(chainTag) &&
    chainTag >= 0 &&
    chainTag <= 255
    ? chainTag
    : MAINNET_CHAIN_TAG;
}
