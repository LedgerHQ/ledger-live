import { log } from "@ledgerhq/logs";
import type { Operation, Page } from "@ledgerhq/coin-module-framework/api/types";

/**
 * Walks a module's `listOperations` cursor chain within one sync. End of stream is a *falsy* `next`:
 * several modules send `""` rather than omitting it. Errors are not caught on purpose - we walk
 * newest-first, so a persisted partial history would never be completed by a later sync.
 *
 * `maxOperations`, when set, bounds the walk in emitted operations (`undefined` is unbounded,
 * identical to today's behaviour). The bound is a parameter, never read from config here, so this
 * stays a pure function. A page is never trimmed to fit the bound exactly: several operations can
 * share one transaction hash (`buildParentOperations` groups by hash), so cutting inside a page
 * could split a transaction's operations across the boundary. The walk stops only *after* the page
 * that reaches the bound, returning that whole page -- overshooting by less than one page is
 * correct, splitting a transaction is not.
 */
export async function paginateOperations(
  fetchPage: (cursor: string | undefined) => Promise<Page<Operation>>,
  maxOperations?: number,
): Promise<Operation[]> {
  const items: Operation[] = [];
  const followed = new Set<string>();
  let cursor: string | undefined;

  for (;;) {
    const { items: pageItems, next } = await fetchPage(cursor);
    for (const item of pageItems) items.push(item);

    if (!next) return items;

    if (maxOperations !== undefined && items.length >= maxOperations) {
      log(
        "generic-coin-framework",
        "listOperations walk stopped: operation-history bound reached",
        {
          maxOperations,
          collected: items.length,
        },
      );
      return items;
    }

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
