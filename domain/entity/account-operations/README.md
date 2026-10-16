# @domain/entity-account-operations

> [!CAUTION]
> **Status: EXPLORATION.** See [the account data layer](../../../docs/account-data-layer.md).
>
> A suggestion of shape, to be studied and delivered on its own: nothing here is settled.

The `operations` kind: an account's operation history, its tokens' included, newest first, keyed by `AccountUUID`.

- Query `{ limit? }`; a page carries `nextCursor` when there is more below it, and `total` when the source knows it.
- A head read replaces the stored operations; a next page merges in, deduplicated by id.
- `selectAccountOperations`, `selectAccountOperationsTotal`, `accountOperationsRemoved`.
