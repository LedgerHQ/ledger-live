import type { AccountRef, AccountSlice } from "./port";

/**
 * Codepoint order, stated explicitly.
 *
 * `Array#sort()` with no comparator coerces elements to strings and compares those — right here only
 * by accident, since every key part already is a string. Naming the comparator makes the intent
 * checkable instead of accidental, and keeps the order independent of the host locale, which
 * `localeCompare` would not be.
 */
const byCodepoint = (a: string, b: string): number => {
  if (a < b) return -1;
  return a > b ? 1 : 0;
};

/**
 * A stable key for a *set* of slices, independent of the order they were passed in.
 *
 * Sorting is load-bearing in three places — demand keys, poll keys, subscription keys — and omitting
 * it in any one of them silently splits one group into two: two subscriptions over the same slices
 * stop recognising each other, so neither release ever sees demand reach zero. Hence one helper.
 */
export const sliceSetKey = (slices: readonly AccountSlice[]): string =>
  [...slices].sort(byCodepoint).join(",");

/** The same, for a set of account ids. */
export const accountIdSetKey = (ids: readonly string[]): string =>
  [...ids].sort(byCodepoint).join(",");

/**
 * A stable key for a *set* of account refs — every field, not just the id.
 *
 * Keying on the id alone would be a correctness bug, not just a missed refresh: the same account id
 * can be handed a new `address` (a fresh receive address rotates on UTXO families) or a corrected
 * `derivationMode`, and a subscription that does not re-register keeps the scheduler polling the ref
 * it captured — reading balances for the wrong address until the component unmounts.
 */
export const accountRefSetKey = (refs: readonly AccountRef[]): string =>
  refs
    .map(ref =>
      [ref.accountId, ref.currencyId, ref.address, ref.derivationMode, ref.parentId ?? ""].join(
        "|",
      ),
    )
    .sort(byCodepoint)
    .join(",");
