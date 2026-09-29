# @domain/entity-account-operations

> [!WARNING]
> **EXPLORATION** — see [`@features/platform-account-data`](../../../features/platform/account-data).

The loaded window of operations per account, newest first, plus a per-account `{ pending, error?, sourceId? }` status.

```
{ byAccount: Record<AccountId, { operations, nextCursor?, complete, at?, total? }>,
  status: Record<AccountId, { pending, error?, sourceId? }> }
```

- A head read replaces the window; a next-page read appends to it, deduplicating by id (a page boundary can repeat an operation).
- A window holds the account's own operations and its token accounts'.
- `total` is optional and usually absent: one page cannot tell how many exist.
- Selectors: `selectAccountOperations`, `selectHasMoreAccountOperations`, `selectAccountOperationsTotal`, `selectAccountOperationsStatus`.
