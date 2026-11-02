# @domain/entity-account-operation

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `operations` kind: the paginated operations of an account, newest first.

- One `AccountOperation` per row, keyed by `AccountUUID`. Token, sub and internal operations are rows of their own, pointing at their parent through `parentId`.
- Amounts are non-negative integers in the asset's smallest unit; `assetId` says which. Fiat values come from `@domain/entity-market-countervalues`, joined where a screen shows them.
- Ids, hashes and addresses are branded.
- The query is `{ limit?, filterAsset? }`; the cursor is a read option the framework carries. The source applies the whole query. The result is `{ operations, nextCursor? }`: no `nextCursor` is the end.
- `filterAsset` keeps the rows of one asset of the account (one of its tokens, or its native coin): its own window, paged on its own.
- `limit` is an intention, not a contract: a page may hold more rows (full sync returns them all at once, token rows come with their parent) or fewer. Only `nextCursor` tells whether more pages exist.
- Stored per account as `{ byId, windows, revisionById }`: each row once (an older answer never overwrites a newer one), and per query (`accountDataQueryKey`) its loaded window of ids. A head read replaces its window, and drops the rows no window lists any more; a next page (`append`) extends it, without duplicates.
- `selectAccountOperations(state, accountUUID, query)` reads the window of that query; `selectAccountOperation` finds a row whatever query read it. Apps mount the slice at `accountOperations`.

Pending, the last error, the source and `nextCursor` stay in `accountData`: `useAccountData("operations", …)` gives `hasMore` and `loadMore`. See [the account data layer](../../../docs/account-data-layer.md).
