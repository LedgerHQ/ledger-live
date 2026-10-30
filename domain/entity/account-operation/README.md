# @domain/entity-account-operation

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `operations` kind: the paginated operations of an account, newest first.

- One `AccountOperation` per row. Token, sub and internal operations are rows of their own, pointing at their parent through `parentId`.
- Amounts are non-negative integers in the asset's smallest unit; `assetId` says which. `countervalues` holds, per fiat ticker a read asked for, what `value` was worth at `date` in that fiat's smallest unit.
- Ids, hashes and addresses are branded.
- The query is `{ limit?, filterAsset?, countervalue? }`; the cursor is a read option the framework carries. The source applies the whole query. The result is `{ operations, nextCursor? }`: no `nextCursor` is the end.
- Stored per account as `{ byId, windows }`: each row once, and per query (`accountDataQueryKey`) its loaded window of ids. A head read replaces its window, and drops the rows no window lists any more; a next page (`append`) extends it, without duplicates. A row read again keeps the countervalues other queries asked for.
- `selectAccountOperations(state, accountUUID, query)` reads the window of that query, unfiltered on the client; `selectAccountOperation` finds a row whatever query read it. Apps mount the slice at `accountOperations`.

Pending, the last error, the source and `nextCursor` stay in `accountData`: `useAccountData("operations", …)` gives `hasMore` and `loadMore`. See [the account data layer](../../../docs/account-data-layer.md).
