# Aleo `listOperations` — public paging

How the coin-module (framework) path pages the public history. Status: **implemented.**

## Scope

Two callers sit on top of [`listPublicOperations.ts`](./listPublicOperations.ts) and want opposite
things:

| Caller | Wants | Uses |
| --- | --- | --- |
| [`bridge/listOperations.ts`](../bridge/listOperations.ts) → [`bridge/sync.ts`](../bridge/sync.ts) | Everything since `lastBlockHeight` | `listPublicOperations` — exhaustive, unchanged |
| [`logic/listOperations.ts`](./listOperations.ts) (framework `CoinModuleApi`) | A bounded slice per page | `listPublicOperationsPage` — new |

The bridge is untouched. Everything below is about the framework path.

## The problem

The framework path used to refetch `[resume_height, tip]` on **every page**, for both the public
transactions and the owned records — and, worse, the explorer walk started at the account's *first*
transaction and filtered by height afterwards, so a high `minHeight` did not make it any cheaper.
Walking a full history was `O(n² / limit)`.

It did this because it built the complete ordered list and sliced it by offset
(`ordered.slice(emittedBefore, emittedBefore + limit)`). An offset is only meaningful against the
whole list, so the whole list had to be fetched.

## Why the stream needs normalising

The explorer pages **per transition**, so one transaction arrives as several rows sharing a
`transaction_id`. `pickTransactionRepresentatives` collapses them to one row, preferring a transition
carrying an address over the bare inner transition of a batching contract, and breaking ties on
`transition_id`.

The pick must be **deterministic across calls** — a replayed page that chose a different
representative would rewrite rows it had already emitted. So a transaction must never be normalised
from a partial set of its rows. That is the constraint the bounded fetch has to respect.

## What the framework contract permits

From `@ledgerhq/coin-module-framework/api/types.ts`:

> **`limit`** — a **soft limit, the implementation may return less _or more_ operations to not waste
> RPC calls**.

> **`cursor`** — implementation **must guarantee the cursor is not volatile**, i.e. it can be used
> long after the last request and still provide consistent results — for instance, a date or
> transaction hash.

Both clauses point the same way. Short and over-long pages are explicitly sanctioned, which is what
made the offset cursor unnecessary. And the old `resume.emitted` — a *count* of operations at a height,
recomputed from a freshly fetched list on every call — was volatile by the contract's own definition:
a late-indexed row or a reorg shifts the count and the next page skips or repeats rows.

So the bounded design is not a trade-off against the contract. It is closer to it.

## Design

Three pieces, none of which needs an explorer API change.

### 1. Bounded fetch — [`fetchAccountTransitionPage`](../network/utils.ts)

Pages forward from `startBlock`, stopping as soon as **more than** `targetTransactions` distinct
transactions are in hand. `startBlock` is passed as the explorer's cursor, so the walk begins near the
requested height instead of at the account's first row — that alone is most of the speedup.

Returns `complete: false` when the explorer still had more.

### 2. Trailing-transaction drop — [`listPublicOperationsPage`](./listPublicOperations.ts)

The transaction the stream ends on may still have rows past the boundary, so its representative would
be picked from a partial set. It is dropped and left for the next page, which refetches from its block
and sees it whole. Nothing is lost, because the caller resumes from the last transaction it *actually
emitted*.

Fetching one transaction more than asked for is what makes this free: after the drop the page is still
full.

When `complete` is true the explorer had nothing left, so every transaction in hand is whole and the
drop does not apply.

### 3. Identity cursor + local skip — [`listOperations.helpers.ts`](./listOperations.helpers.ts)

The cursor names the last emitted operation by `(block, transactionId)` — the same pair the total order
sorts on. On resume:

- the window **reopens on that block** rather than after it, because the explorer resumes at block
  granularity;
- `dropThroughResumePoint` removes what was already emitted, comparing in the stream's own total order
  rather than looking the operation up by identity — so a resume point that has since vanished (reorg,
  re-index) still cuts in the right place instead of replaying the page.

The explorer's cursor only has to land us in the right block. The exact position inside it is a local
concern.

```
cursor: { minHeight, maxBlockHeight, order, resume: { block, transactionId } }

1. fetch from cursor_block_number = resume.block
2. skip locally past resume.transactionId
3. normalise rows → transactions
4. drop the transaction the stream ends on (unless complete)
5. emit; cursor = last emitted operation
```

### Widening retry

A block holding more transactions than the fetch asked for would yield a page whose rows were all
emitted already — and a cursor that has not moved. `listOperations` widens the fetch (×4, capped at
`MAX_TARGET_TRANSACTIONS`) until the block clears, rather than hand back an empty page that would end
the walk early or spin on the same cursor.

This is the only place a "bigger limit" appears, and it is a rare escape hatch rather than the
mechanism.

### Ceiling clamp

A bounded public stream can only vouch for the range it actually reached. Merging private operations
past that point would emit them ahead of the public rows sharing their heights, and the next page would
then repeat those rows. So when the public stream is incomplete, the merge window clamps to the last
height it covered — and only then, or an account whose newest activity is private-only would have it
withheld forever.

## What this deleted

- `buildResumePoint`'s emitted-count logic and the whole `resume.emitted` field
- the `ordered.slice(emittedBefore, …)` offset slicing
- the deliberate boundary-height re-read and skip-by-count — pages no longer overlap by construction
- the "only the opening page owns the empty-range rule" special case

## Assumption still to verify

**`cursor_block_number = B` must return block `B` from its start.** If the explorer treats it as
exclusive, the operations in `B` that a page had not yet emitted are lost on resume.

The pre-existing code already bet on inclusivity twice — [`network/utils.ts`](../network/utils.ts)
pages on the API's own mid-block `next_cursor`, and `getLastTransactionCursor` hands back the last
*emitted* transaction's block — so this is not a new risk, but it is now load-bearing.

**Cheap fix if it turns out exclusive:** pass `B - 1`. The local skip makes the result identical either
way; only the value to send changes.

Worth pinning with an integ test against the real explorer.

## Known limitations

1. **`fetchAllOwnedRecords` is still exhaustive** from the window's lower bound. It is a bulk endpoint
   (1000/page) and the expensive half — per-record decryption — is already bounded by the window
   filter, so this was left alone. Bounding it needs its own approach, and depends on whether the
   scanner returns records in block-height order.
2. **The trailing-transaction drop assumes a transaction's transitions are contiguous** in the explorer
   stream. If two transactions can interleave at the very end of a page, the second-to-last could also
   be partial. Standard explorer ordering makes this a non-issue, but it is an assumption.
3. **`bridge/listOperations.ts` still passes `limit` / `cursor` / `order`** through to the exhaustive
   path, where they are ignored. Vestigial — `sync.ts` reads neither. Worth removing separately.

## Unrelated cleanups on this branch

- `operationsCursor.ts` → `listOperations.helpers.ts` (plus its test).
- `getScannerSyncedHeight` returns `0` unconditionally when `synced_up_to` is absent. `synced: true`
  reports nothing about how far the scanner actually got, so treating it as the chain tip claimed a
  completeness the scanner never reported.
