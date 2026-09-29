# @domain/api-account-data-source

> [!WARNING]
> **EXPLORATION** — see [docs/account-data-layer.md](../../../docs/account-data-layer.md).

The implementation side of the account data protocol.

- `AccountDataSource`: `{ id, supports(ref, datum) }` plus one optional method per datum, derived from the `AccountData` map.
- `createAccountDataRouter(sources)`: `router.read(datum, ref, query, { signal?, sourceId? })` asks the first source, in array order, that has the method and supports `(ref, datum)`.
- `fetchAccountData(binding, ref, { maxAge?, query?, more? })`: the one generic thunk (freshness guard, in-flight guard per ref, pagination). It reads the router from `extra.accountData`.

It knows no slice and no source.
