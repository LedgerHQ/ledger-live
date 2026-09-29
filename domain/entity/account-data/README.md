# @domain/entity-account-data

> [!WARNING]
> **EXPLORATION** — see [docs/account-data-layer.md](../../../docs/account-data-layer.md).

The data side of the account data protocol. Types only, no runtime code.

- `AccountData`: an open interface, extended by each `account-*` entity through declaration merging.
- `AccountDatum`, `AccountDataQuery<K>`, `AccountDataResult<K>`: derived from it.
- `AccountDataBinding<K, S>`: how a slice receives one datum (the actions to dispatch, the selectors the generic thunk reads).
