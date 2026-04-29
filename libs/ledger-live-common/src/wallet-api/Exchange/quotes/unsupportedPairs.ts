/**
 * Hard-coded blocklist of currency pairs the Swap Wallet API refuses to
 * surface quotes for, independently of what the upstream aggregator returns.
 *
 * Each entry is direction-agnostic: `[a, b]` blocks both `a -> b` and
 * `b -> a`. Entries must match Ledger currency ids, which are lowercase by
 * convention (e.g. `bitcoin`, `ethereum`, `near`, `stellar`).
 */
const UNSUPPORTED_PAIRS: ReadonlyArray<readonly [string, string]> = [["near", "stellar"]];

/**
 * Returns `true` when the (sendCurrencyId, receiveCurrencyId) pair is on the
 * wallet-side blocklist in either direction.
 *
 * Comparison is a strict string equality against the entries in
 * `UNSUPPORTED_PAIRS`; callers are expected to pass canonical lowercase
 * currency ids (the same value shipped to the swap aggregator URL).
 */
export function isUnsupportedPair(sendCurrencyId: string, receiveCurrencyId: string): boolean {
  return UNSUPPORTED_PAIRS.some(
    ([a, b]) =>
      (sendCurrencyId === a && receiveCurrencyId === b) ||
      (sendCurrencyId === b && receiveCurrencyId === a),
  );
}
