import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type ZcashConfig = {
  /** Zaino (lightwalletd gRPC) server used by shielded sync and every send. */
  zaino: {
    url: string;
    /**
     * Budget for one shielded scan chunk (one server round-trip) of the automatic sync leg,
     * after which the leg is treated as hung and stopped for this tick. It resets on every
     * emission, so it bounds a single chunk, not the whole catch-up; the next tick resumes
     * from `lastProcessedBlock`.
     */
    timeoutMs: number;
    /** Maximum number of blocks the native engine scans per shielded sync chunk. */
    batchSize: number;
  };
  /** Ledger explorer the transparent (wallet-btc) side reads its history from. */
  explorer: { url: string };
};

export type ZcashCoinConfig = CurrencyConfig & ZcashConfig;

/** The {@link Context} threaded through the coin-zcash bridge (ADR-019). */
export type ZcashContext = Context<ZcashCoinConfig>;
