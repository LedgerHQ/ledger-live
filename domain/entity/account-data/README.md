# @domain/entity-account-data

> [!CAUTION]
> **Status: UNSTABLE.** API may change while the first entities plug in.

What an account can be asked for, and how its reads went.

- `AccountDataRegistry`: an open interface, one key per kind of entity data, each with its `query` and `result` types. Empty here: each `@domain/entity-account-*` package adds its kind by module augmentation. `AccountDataKind`, `AccountDataQuery<K>`, `AccountDataResult<K>` read from it.
- `accountDataSlice` (`accountData` in the app state): per kind, account and query, the read in flight, the last error, and the source, time and next cursor of the stored data. `selectAccountDataStatus(state, kind, accountUUID, query)` reads it.
- `accountDataQueryKey(query)`: the key a query's status and data are stored under; key order and unset fields do not change it.
- `accountDataReceived` and `isAccountDataReceived(kind)`: the answer an entity slice matches to store its data, with the `queryKey` it answers.
- `AccountDataSourceIdSchema`: the branded id of a source.

See [the account data layer](../../../docs/account-data-layer.md) for the read flow and how to add an entity.
