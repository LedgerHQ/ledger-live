---
"@ledgerhq/live-common": patch
---

fix(coin-framework): follow the listOperations cursor so account history is no longer truncated to one page

getAccountShape called listOperations once and discarded the returned `next`, so any account with
more operations than one explorer page never received the rest, and no later sync recovered the
tail: the walk is newest-first and `minHeight` only ever moves forward, so the pages below the
first were lost for good.

It now walks the cursor chain within a sync, treating a falsy cursor as end of stream. The walk is
unbounded — only a module that cannot progress ends it early: an empty page, or a cursor already
followed (a repeat, or a longer cycle). The `extra.pagingToken` resume read is removed:
nothing could ever write it, and `minHeight` is the resume position across syncs.

On the coin-evm side, the Ledger explorer's `fetchPaginatedOpsWithRetries` appends each batch in
place instead of rebuilding the whole accumulator (`[...previous, ...batch]`) once per page.
