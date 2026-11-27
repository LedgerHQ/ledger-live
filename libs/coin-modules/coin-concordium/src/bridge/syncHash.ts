/**
 * Bumped when the parser starts keeping or revaluing rows it read differently,
 * so every stored history is re-read once. 2: aliases of the account matched.
 * 3: every row that cost or moved CCD kept.
 *
 * A token whose CAL unit, decimals or balance cannot be trusted during that
 * re-read keeps its stored rows, and nothing re-reads them later: LIVE-41804.
 */
export const HISTORY_VERSION = "history=3";

export const TOKENS_OFF_SYNC_HASH = `tokens=off:${HISTORY_VERSION}`;

/**
 * Matches no computed hash, so the next sync re-reads from height zero.
 *
 * A sync stores it when it fetched PLT transfers it could not attribute. It
 * stays set for as long as the cause lasts. The causes are transient by
 * construction — a balance response without its token list, a CAL that will not
 * answer — so the re-read repeats while the fault does and stops when it lifts.
 * Anything permanent is kept out of this marker at the `tokens.ts` end.
 *
 * The load strip stores it when the stored history does not match the tokens-off
 * state it leaves.
 */
export const REFETCH_SYNC_HASH = "refetch-pending";
