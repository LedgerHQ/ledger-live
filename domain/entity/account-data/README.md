# @domain/entity-account-data

> [!CAUTION]
> **Status: UNSTABLE.** API may change while the first entities plug in.

Types only: what an account can be asked for, and how an entity slice takes part in a read.

- `AccountDataRegistry`: an open interface, one key per kind of entity data, each with its `query` and `result` types. Empty here: each `@domain/entity-account-*` package adds its kind by module augmentation.
- `AccountDataKind`, `AccountDataQuery<K>`, `AccountDataResult<K>`: read from the registry.
- `AccountDataBinding<K, S>`: the actions that store a result, a pending state and an error in the entity slice, and the selectors the generic read needs.

See [the account data layer](../../../docs/account-data-layer.md) for the read flow and how to add an entity.
