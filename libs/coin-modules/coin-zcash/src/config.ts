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
  /** Explorer id of the currency on the Ledger explorer; falls back to the currency id. */
  explorerId?: string;
  /**
   * ZIP 2009 (marginal fee cut from 5,000 to 1,000 zatoshis per logical action) on mainnet.
   * The bundled builder only accepts the lower fee from its own switch height, so this can
   * delay or disable the switch, never advance it. Test networks ignore it. Absent, `null`
   * or malformed, it falls back to the default switch height.
   */
  zip2009?: {
    /**
     * Mainnet height from which sends are priced at the ZIP 2009 fee. `null` disables it
     * (5,000 at every height); a value below ZIP2009_MAINNET_HEIGHT is raised to it.
     * @default ZIP2009_MAINNET_HEIGHT (3590000)
     */
    mainnetHeight: number | null;
  } | null;
};

export type ZcashCoinConfig = CurrencyConfig & ZcashConfig;

/** The {@link Context} threaded through the coin-zcash bridge (ADR-019). */
export type ZcashContext = Context<ZcashCoinConfig>;
