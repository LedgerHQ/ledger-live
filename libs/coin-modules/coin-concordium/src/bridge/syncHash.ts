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
