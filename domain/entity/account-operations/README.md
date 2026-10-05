# @domain/entity-account-operations

> [!CAUTION]
> **Status: EXPLORATION.** See [the account data layer](../../../docs/account-data-layer.md).

The loaded window of operations per account, newest first, plus a per-account
`{ pending, error?, sourceId? }` status.

```
{ byAccount: Record<AccountId, { operations, nextCursor?, complete, at?, total? }>,
  status: Record<AccountId, { pending, error?, sourceId? }> }
```

- Declares the `operations` datum in [`AccountData`](../account-data): `AccountOperationsQuery`
  (`cursor`, `limit`) in, `AccountOperationsPage` out.
- `accountOperationsBinding` lets the generic read drive this slice, including the next page
  through `selectNextQuery`.
- A head read replaces the window; a next page merges into it, deduplicating by id, since a page
  boundary can repeat an operation.
- A window holds the account's own operations and its token accounts'.
- `total` is optional and usually absent: one page cannot tell how many exist.
- Selectors: `selectAccountOperations`, `selectAccountOperationsEntry`,
  `selectHasMoreAccountOperations`, `selectAccountOperationsTotal`, `selectAccountOperationsStatus`,
  `selectAccountOperationsAt`.
