import { log } from "@ledgerhq/logs";
import type { Operation, Page } from "@ledgerhq/coin-module-framework/api/types";

// Not a retention policy: `maxOperations` is expected to bind the walk long before this many pages
// are ever fetched. This is a termination guarantee against a module that pages forever with
// advancing cursors -- a bug, not a scenario this framework should ever legitimately hit. Firing it
// is logged loudly (see below) precisely so it reads as an anomaly, not a normal stop.
export const PAGE_BUDGET = 1000;

/**
 * Walks a module's `listOperations` cursor chain within one sync. End of stream is a *falsy* `next`:
 * several modules send `""` rather than omitting it. Errors are not caught on purpose - we walk
 * newest-first, so a persisted partial history would never be completed by a later sync: the caller
 * resumes from `minHeight = newest stored + 1`, so whatever is persisted below that watermark is
 * never refetched. A gap left there does not heal on the next sync, it seals.
 *
 * A truthy `next` only asserts that *more operations may exist* -- it is not a promise that the
 * page handed back alongside it is non-empty. An empty page with a truthy, advancing `next` is not
 * an end of stream: some modules filter an indexer page down to zero operations for the queried
 * address and still hand back the cursor to continue from. `coin-stellar` does this by design ("always
 * return the cursor so the caller can continue pagination, even when the filtered page is empty --
 * e.g. a page of unsupported operation types"); `coin-xrp` does it structurally, fetching one indexer
 * page, dropping the transactions with no balance impact, and returning the node's marker regardless
 * of how many transactions survived the filter. Stopping on an empty page would silently truncate
 * both of them (and, through the paginated explorer arm, evm) well short of the real history.
 *
 * `maxOperations`, when set, bounds the walk in emitted operations (`undefined` is unbounded,
 * identical to today's behaviour). The bound is a parameter, never read from config here, so this
 * stays a pure function. A page is never trimmed to fit the bound exactly: several operations can
 * share one transaction hash (`buildParentOperations` groups by hash), so cutting inside a page
 * could split a transaction's operations across the boundary. The walk stops only *after* the page
 * that reaches the bound, returning that whole page -- overshooting by less than one page is
 * correct, splitting a transaction is not.
 *
 * `maxOperations` is the only stop that *returns* a partial list: it is an intended, contiguous
 * window from the tip, known and accepted by the caller. Every other stop below the falsy-`next`
 * end-of-stream -- the cursor not advancing, or the page budget running out -- *throws* instead of
 * returning what was collected so far, consistent with the "errors are not caught" principle above:
 * neither is a state this framework can be in legitimately, both leave a gap below the newest
 * retained operation, and that gap would seal on the next sync exactly like a swallowed error would.
 * A module that pages forever with advancing cursors would otherwise loop indefinitely when
 * `maxOperations` is unset (or never reached, because the pages it returns are empty); `PAGE_BUDGET`
 * is the termination guarantee for that case.
 */
export async function paginateOperations(
  fetchPage: (cursor: string | undefined) => Promise<Page<Operation>>,
  maxOperations?: number,
): Promise<Operation[]> {
  const items: Operation[] = [];
  const followed = new Set<string>();
  let cursor: string | undefined;
  let pagesFetched = 0;

  for (;;) {
    const { items: pageItems, next } = await fetchPage(cursor);
    pagesFetched++;
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

    if (followed.has(next)) {
      log("generic-coin-framework", "listOperations cursor cycled", {
        cursor,
        next,
      });
      // Thrown, not returned: `next` was served twice, so the walk is not at a real end of stream --
      // what was collected is a fragment, not a history, and the caller's watermark would seal the
      // gap below it on the next sync.
      throw new Error(
        `paginateOperations: cursor ${next} was served twice -- the ${items.length} operations collected so far are a fragment, not a complete history`,
      );
    }

    if (pagesFetched >= PAGE_BUDGET) {
      log(
        "generic-coin-framework",
        "listOperations walk stopped: page budget reached (safety net, not an expected stop)",
        {
          pagesFetched,
          collected: items.length,
        },
      );
      // Thrown for the same reason as the cursor-cycle guard above: the budget is a safety net
      // against a module that never reaches a real end of stream, not an intended bound like
      // `maxOperations` -- what was collected is a fragment, not a history.
      throw new Error(
        `paginateOperations: page budget (${PAGE_BUDGET}) reached after collecting ${items.length} operations -- the result is a fragment, not a complete history`,
      );
    }

    followed.add(next);
    cursor = next;
  }
}
