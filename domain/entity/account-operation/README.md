# @domain/entity-account-operation

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `operations` kind: the paginated operations of an account, newest first.

- One `AccountOperation` per row, keyed by `AccountUUID`. Token, sub and internal operations are rows of their own, pointing at their parent through `parentId`.
- Amounts are non-negative integers in the asset's smallest unit; `assetId` says which. Fiat values come from `@domain/entity-market-countervalues`, joined where a screen shows them.
- Ids, hashes and addresses are branded.
- The query is `{ limit? }`; the cursor is a read option the framework carries. The result is `{ operations, nextCursor? }`: no `nextCursor` is the end. An asset filter belongs to the source, once status is stored per query.
- A head read replaces the loaded window; a next page (`append`) extends it, without duplicates.
- `selectAccountOperations`, `selectAccountOperation`. Apps mount the slice at `accountOperations`.

Pending, the last error, the source and `nextCursor` stay in `accountData`: `useAccountData("operations", …)` gives `hasMore` and `loadMore`. See [the account data layer](../../../docs/account-data-layer.md).
