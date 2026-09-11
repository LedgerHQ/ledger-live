---
"@ledgerhq/live-common": minor
---

Bound the synchronised operation history for `generic-coin-framework` accounts (evm, hypercore,
xrp, stellar, tezos, tron, casper). The retained operations are always the most recent ones, kept
stable across repeated syncs, and the bound is resolved per currency through remote config rather
than hardcoded.

It ships with a **safety ceiling** rather than unbounded: a sync that accumulates without any
ceiling cannot complete on a very large account — measured at roughly 2 KB of live heap per
retained operation, which on the account from the out-of-memory report extrapolates past 16 GB.
The shipped figure is the largest ceiling measured to complete a full sync on that account. It is
an engineering bound, not a retention policy: a lower per-currency or global `maxOperations` set
remotely overrides it at any time, and the ceiling counts raw operations as modules emit them —
before filtering and before grouping by transaction — so it is not a count of rows a user sees.

The module's paginated `listOperations` walk is now always given a `limit`, sized from a
configurable per-page size (falling back to a safe default). This is independent of the bound
above: a `limit` bounds what a single page costs, the bound governs how much history is retained.
Without it the walk's first "page" could be the entire history in one unbounded call, and no
ceiling would get a chance to stop it before memory ran out. Note that a `limit` flips several
modules onto a distinct, limit-aware fetch path, so this changes how every family fetches — not
what it retains.

Fix a truncation bug in the same walk, independent of everything above: it used to stop as soon as
a page came back empty, even when the module handed back a cursor to keep going. That shape is
legitimate, not an end of stream — `coin-stellar` and `coin-xrp` both return it for a page filtered
down to zero operations for the queried address — so real history was being cut off silently, page
after page, until the module happened to return a falsy cursor. The walk now keeps following an
empty page as long as the cursor still advances, and a page budget (a fixed, generous ceiling on
pages fetched, unrelated to the operation bound above) guarantees the walk still terminates against
a module that pages forever.

**This is user-visible**: accounts that were silently truncated will now sync their full history.
For a family that returns empty pages with advancing cursors — stellar and xrp today — the first
sync after this lands may fetch substantially more than before.

Also **user-visible**: a sync that stalls on a repeated cursor, or that only stops because the page
budget above was reached, now fails the sync instead of quietly persisting whatever was collected up
to that point. Both are states this framework cannot legitimately be in, and returning a partial list
from either would leave a gap below the newest retained operation that the next sync's watermark
would never go back and fill — a silent, permanent hole rather than a failed sync that simply retries.
Reaching `maxOperations` is the opposite case — an intended, contiguous truncation from the tip — so
it still returns the operations collected so far rather than throwing.
