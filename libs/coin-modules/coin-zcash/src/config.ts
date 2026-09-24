import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type ZcashConfig = {
  /** Zaino (lightwalletd gRPC) server used by shielded sync and every send. */
  zaino: { url: string };
  /** Ledger explorer the transparent (wallet-btc) side reads its history from. */
  explorer: { url: string };
};

export type ZcashCoinConfig = CurrencyConfig & ZcashConfig;

/** The {@link Context} threaded through the coin-zcash bridge (ADR-019). */
export type ZcashContext = Context<ZcashCoinConfig>;
