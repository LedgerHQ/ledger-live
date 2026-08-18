import { CurrencyConfig, CoinConfig, type Context } from "@ledgerhq/coin-module-framework/config";
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

/** The {@link Context} threaded through the coin-vechain API layer (ADR-019). */
export type VechainContext = Context<VechainCurrencyConfig>;

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

/**
 * Thor REST endpoint. Config is threaded in explicitly by every caller: the Alpaca (`createApi`)
 * path resolves it from `context.config()`, and the classic bridge resolves it once from the
 * {@link getCoinConfig} singleton at its entry points and passes it down.
 */
export function getNodeUrl(config: VechainCurrencyConfig): string {
  const { node } = config;

  if (!node?.url) {
    throw new Error("vechain: node.url is missing from the coin config");
  }

  return node.url;
}

export function getChainTag(config: VechainCurrencyConfig): number {
  const { chainTag } = config;
  return typeof chainTag === "number" &&
    Number.isInteger(chainTag) &&
    chainTag >= 0 &&
    chainTag <= 255
    ? chainTag
    : MAINNET_CHAIN_TAG;
}
