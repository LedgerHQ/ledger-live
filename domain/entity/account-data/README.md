# @domain/entity-account-data

> [!CAUTION]
> **Status: UNSTABLE.** API may change while the first entities plug in.

What an account can be asked for, and how its reads went.

- `AccountDataRegistry`: an open interface, one key per kind of entity data, each with its `query` and `result` types. Empty here: each `@domain/entity-account-*` package adds its kind by module augmentation. `AccountDataKind`, `AccountDataQuery<K>`, `AccountDataResult<K>` read from it.
- `accountDataSlice` (`accountData` in the app state): per kind and account, the read in flight, the last error, and the source, query, time and next cursor of the stored data. `selectAccountDataStatus` reads it.
- `accountDataReceived` and `isAccountDataReceived(kind)`: the answer an entity slice matches to store its data.
- `AccountDataSourceIdSchema`: the branded id of a source.

See [the account data layer](../../../docs/account-data-layer.md) for the read flow and how to add an entity.
