import type { PayCardTransaction } from "./types";

/**
 * Whether the card has been used at all.
 *
 * Reads the first page only, and that is exact rather than a shortcut: the provider pages newest
 * first, so a later page can only exist once the first came back full. Callers run on hot paths —
 * one is every analytics event — so this stays O(1) instead of joining the cached history.
 */
export function hasCardTransactions(
  pages: readonly (readonly PayCardTransaction[])[] | undefined,
): boolean {
  return (pages?.[0]?.length ?? 0) > 0;
}
