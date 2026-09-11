import { log } from "@ledgerhq/logs";
import type { Operation, Page } from "@ledgerhq/coin-module-framework/api/types";

// Termination net for a caller that passes no `maxOperations`, and only for that case. Counting
// pages cannot serve a *bounded* caller: reaching a bound of N operations through pages of size P
// legitimately costs ceil(N / P) pages, so any fixed page count is a bound on operations in
// disguise, and a smaller one than the caller asked for. With the shipped defaults that misfired
// outright -- 1000 pages of 100 is 100 000 operations against a 200 000 bound, so a module that
// honoured the requested page size exactly could never reach the bound and the sync threw at page
// 1000 instead. The better the module behaved, the more surely the sync failed. Sizing the constant
// up only moves that cliff: a module returning half-full pages needs twice as many, and an
// arbitrary slack factor is a guess about every module's page shape.
//
// So a bounded caller does not get a page count at all -- it gets `EMPTY_PAGE_BUDGET` below, which
// counts the thing that actually cannot terminate. See the termination argument on
// `paginateOperations`.
export const PAGE_BUDGET = 1000;

// The pathology `maxOperations` cannot bound: a module that advances its cursor forever while
// returning nothing. An empty page is legitimate (see `paginateOperations`) and the walk must follow
// it, so the only honest signal is a *run* of them -- long enough that no real indexer sparsity
// reaches it, and independent of page size and of the bound, unlike a page count. A single page that
// yields one operation resets the run: this can never fire on a walk that is making progress.
export const EMPTY_PAGE_BUDGET = 1000;

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
 * end-of-stream -- the cursor not advancing, a run of pages producing nothing, or the page budget
 * running out -- *throws* instead of
 * returning what was collected so far, consistent with the "errors are not caught" principle above:
 * neither is a state this framework can be in legitimately, both leave a gap below the newest
 * retained operation, and that gap would seal on the next sync exactly like a swallowed error would.
 * **Why this terminates.** Every iteration fetches a page that either yields at least one operation
 * or yields none. Productive pages each add to the total, so at most `maxOperations` of them can be
 * fetched before the bound stops the walk. Unproductive ones are counted consecutively and capped by
 * `EMPTY_PAGE_BUDGET`, and any productive page resets that count. So for a bounded caller the walk is
 * finite without needing a ceiling on pages at all -- which is why it does not have one, and why
 * `PAGE_BUDGET` applies only when `maxOperations` is unset, the one case with no other net.
 */
export async function paginateOperations(
  fetchPage: (cursor: string | undefined) => Promise<Page<Operation>>,
  maxOperations?: number,
): Promise<Operation[]> {
  const items: Operation[] = [];
  const followed = new Set<string>();
  let cursor: string | undefined;
  let pagesFetched = 0;
  let consecutiveEmptyPages = 0;

  for (;;) {
    const { items: pageItems, next } = await fetchPage(cursor);
    pagesFetched++;
    consecutiveEmptyPages = pageItems.length === 0 ? consecutiveEmptyPages + 1 : 0;
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

    if (consecutiveEmptyPages >= EMPTY_PAGE_BUDGET) {
      log(
        "generic-coin-framework",
        "listOperations walk stopped: empty-page budget reached (safety net, not an expected stop)",
        {
          consecutiveEmptyPages,
          pagesFetched,
          collected: items.length,
        },
      );
      // Thrown for the same reason as the cursor-cycle guard above: a module advancing its cursor
      // without producing anything has not reached a real end of stream, so what was collected is a
      // fragment, not a history.
      throw new Error(
        `paginateOperations: ${consecutiveEmptyPages} consecutive empty pages -- the module keeps advancing its cursor without returning operations, so the ${items.length} operations collected so far are a fragment, not a complete history`,
      );
    }

    if (maxOperations === undefined && pagesFetched >= PAGE_BUDGET) {
      log(
        "generic-coin-framework",
        "listOperations walk stopped: page budget reached (safety net, not an expected stop)",
        {
          pagesFetched,
          collected: items.length,
        },
      );
      // Same reasoning again, for the unbounded caller: with no `maxOperations` to stop a module
      // that pages forever *while producing operations*, a page count is the only net left.
      throw new Error(
        `paginateOperations: page budget (${PAGE_BUDGET}) reached after collecting ${items.length} operations -- the result is a fragment, not a complete history`,
      );
    }

    followed.add(next);
    cursor = next;
  }
}
