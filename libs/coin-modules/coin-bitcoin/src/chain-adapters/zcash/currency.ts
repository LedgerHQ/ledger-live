/**
 * The currencies served by the Zcash chain adapter. `zcash_regtest` is
 * deliberately absent: it keeps the generic Bitcoin-family behaviour.
 */
export const ZCASH_CURRENCY_IDS = ["zcash", "zcash_testnet"] as const;

export const isZcashCurrencyId = (id: string): boolean =>
  (ZCASH_CURRENCY_IDS as readonly string[]).includes(id);
