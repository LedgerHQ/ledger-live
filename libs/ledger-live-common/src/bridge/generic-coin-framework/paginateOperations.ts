import { log } from "@ledgerhq/logs";
import type { Operation, Page } from "@ledgerhq/coin-module-framework/api/types";

/**
 * Walks a module's `listOperations` cursor chain within one sync. End of stream is a *falsy* `next`:
 * several modules send `""` rather than omitting it. Errors are not caught on purpose - we walk
 * newest-first, so a persisted partial history would never be completed by a later sync.
 */
export async function paginateOperations(
  fetchPage: (cursor: string | undefined) => Promise<Page<Operation>>,
): Promise<Operation[]> {
  const items: Operation[] = [];
  const followed = new Set<string>();
  let cursor: string | undefined;

  for (;;) {
    const { items: pageItems, next } = await fetchPage(cursor);
    for (const item of pageItems) items.push(item);

    if (!next) return items;

    if (pageItems.length === 0) {
      log("generic-coin-framework", "listOperations returned an empty page with a cursor", {
        cursor,
        next,
      });
      return items;
    }

    if (followed.has(next)) {
      log("generic-coin-framework", "listOperations cursor cycled", {
        cursor,
        next,
      });
      return items;
    }

    followed.add(next);
    cursor = next;
  }
}
