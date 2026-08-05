import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-module-framework/config";
import { MissingCoinConfig } from "@ledgerhq/coin-module-framework/errors";
import { MAINNET_CHAIN_TAG } from "./types";

/**
 * `node.url` is the Thor REST endpoint. It is part of the coin config, as in coin-stellar and
 * coin-xrp, rather than read from `@ledgerhq/live-env` inside the module: a coin module that
 * resolves its own endpoint drags a wallet-side dependency into environments that have no
 * `live-env` at all, such as the standalone coin-service.
 */
export type VechainCurrencyConfig = CurrencyConfig & {
  chainTag?: number;
  node: { url: string };
};

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

/** Thor REST endpoint, resolved per call so a config change is picked up without a reload. */
export function getNodeUrl(): string {
  const { node } = getCoinConfig();

  if (!node?.url) {
    throw new Error("vechain: node.url is missing from the coin config");
  }

  return node.url;
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
