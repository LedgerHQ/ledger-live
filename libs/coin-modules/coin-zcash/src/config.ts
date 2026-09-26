import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type ZcashConfig = {
  /** Zaino (lightwalletd gRPC) server used by shielded sync and every send. */
  zaino: {
    url: string;
    /**
     * Budget for one shielded scan chunk (one server round-trip) of the automatic sync leg,
     * after which the leg is treated as hung and stopped for this tick.
     * @default ZCASH_SHIELDED_CHUNK_TIMEOUT_MS (120000)
     */
    timeoutMs?: number;
    /**
     * Maximum number of blocks the native engine scans per shielded sync chunk.
     * @default ZCASH_SHIELDED_BATCH_SIZE (5000)
     */
    batchSize?: number;
  };
  /** Ledger explorer the transparent (wallet-btc) side reads its history from. */
  explorer: { url: string };
};

export type ZcashCoinConfig = CurrencyConfig & ZcashConfig;

/** The {@link Context} threaded through the coin-zcash bridge (ADR-019). */
export type ZcashContext = Context<ZcashCoinConfig>;
