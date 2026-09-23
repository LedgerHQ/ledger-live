import type { PayCardTransaction } from "./types";

/** The provider numbers its pages from zero. */
export const FIRST_CARD_TRANSACTIONS_PAGE = 0;

/**
 * Which page to ask for after the one just read, or `undefined` once the list has ended.
 *
 * An empty page is the end. A history that exactly fills its last page therefore costs one further
 * request, which comes back empty.
 */
export function nextCardTransactionsPage(
  lastPage: readonly PayCardTransaction[],
  _allPages: readonly (readonly PayCardTransaction[])[],
  lastPageParam: number,
): number | undefined {
  return lastPage.length === 0 ? undefined : lastPageParam + 1;
}

/**
 * The pages read so far as one list, newest first, with repeats dropped.
 *
 * A purchase landing between two reads shifts the paging down, so one transaction can arrive on
 * two consecutive pages, and a later page can carry something newer than anything on the first.
 * Left where it was read, that newer charge would sit at the bottom of a newest-first list and
 * open a second day group there showing the newest charge as the oldest.
 *
 * Compared as instants rather than as strings: `dateTime` is only validated as non-empty, so a
 * provider that switched from `Z` to an offset would sort wrongly and silently.
 */
export function joinCardTransactionsPages(
  pages: readonly (readonly PayCardTransaction[])[] | undefined,
): PayCardTransaction[] {
  const seen = new Set<string>();

  return (pages ?? [])
    .flat()
    .filter(({ id }) => {
      if (seen.has(id)) {
        return false;
      }

      seen.add(id);
      return true;
    })
    .sort((left, right) => Date.parse(right.dateTime) - Date.parse(left.dateTime));
}
