# @domain/entity-account-operation

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `operations` kind: the paginated operations of an account, newest first.

- One `AccountOperation` per row. Token, sub and internal operations are rows of their own, pointing at their parent through `parentId`.
- Amounts are non-negative integers in the asset's smallest unit; `assetId` says which. `countervalues` holds, per fiat ticker a read asked for, what `value` was worth at `date` in that fiat's smallest unit.
- Ids, hashes and addresses are branded.
- The query is `{ limit?, filterAsset?, countervalue? }`; the cursor is a read option the framework carries. The source applies the whole query. The result is `{ operations, nextCursor? }`: no `nextCursor` is the end.
- `limit` is an intention, not a contract: a page may hold more rows (full sync returns them all at once, token rows come with their parent) or fewer. Only `nextCursor` tells whether more pages exist.
- Stored per account as `{ byId, windows, countervalues, revisionById }`: each row once, without countervalues (an older answer never overwrites a newer one), and per query (`accountDataQueryKey`) its loaded window of ids and the countervalues its read returned. A head read replaces its window and its countervalues, and drops the rows no window lists any more; a next page (`append`) extends both, without duplicates. A query never sees the countervalues of another.
- `selectAccountOperations(state, accountUUID, query)` reads the window of that query with its countervalues, unfiltered on the client; `selectAccountOperation` finds a row whatever query read it, without countervalues. Apps mount the slice at `accountOperations`.

Pending, the last error, the source and `nextCursor` stay in `accountData`: `useAccountData("operations", …)` gives `hasMore` and `loadMore`. See [the account data layer](../../../docs/account-data-layer.md).
