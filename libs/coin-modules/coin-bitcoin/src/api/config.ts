import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

/**
 * Alpaca-side configuration for coin-bitcoin.
 *
 * Kept separate from the legacy bridge config in `../config.ts` (which the bridge keeps using
 * unchanged). The Alpaca surface is stateless: it resolves config per call via
 * `context.config(currencyId)` (ADR-019) rather than a module-level singleton.
 */
export type BitcoinConfig = {
  /** Optional explorer override. When absent, the currency's default endpoint is used. */
  explorer?: { uri?: string };
};

export type BitcoinCoinConfig = CurrencyConfig & BitcoinConfig;

/** The {@link Context} threaded through the coin-bitcoin Alpaca layers (ADR-019). */
export type BitcoinContext = Context<BitcoinCoinConfig>;
