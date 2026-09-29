# @domain/api-account-data-source

> [!CAUTION]
> **Status: EXPLORATION.** API still being designed.

The account data **protocol**, implementation side, and the one generic read.

## Responsibility

- `AccountDataSource`: what a source implements: an `id`, `supports(ref, datum)`, and one optional
  method per datum of [`AccountData`](../../entity/account-data), named after it. A source serves
  what it can and leaves the rest out.
- `createAccountDataRouter(sources)`: the app ranks its sources; the first that implements the datum
  and supports the ref answers. `read(datum, ref, query, { signal, sourceId })` returns the data and
  which source gave it.
- `fetchAccountData(binding, ref, options)`: the thunk that reads any datum into its slice, through
  the router found in the thunk `extraArgument` under `accountData`. Head reads are guarded by
  freshness (`maxAge`) and by an in-flight read of the same ref. A next page (`more: true`) is guarded
  by the pending flag only, and pinned to the source that answered the head.
- `NoAccountSourceError`: nobody can answer.

This package knows no slice and no source. The React hook is in
[`@features/platform-account-data`](../../../features/platform/account-data).

## Usage

```ts
// app composition root
const accountData = createAccountDataRouter([coinModuleSource, fullSyncSource]);
configureStore({
  reducer,
  middleware: getDefault => getDefault({ thunk: { extraArgument: { ...extra, accountData } } }),
});

// anywhere with a dispatch
await dispatch(fetchAccountData(accountOperationsBinding, ref, { query: { limit: 50 } }));
await dispatch(fetchAccountData(accountOperationsBinding, ref, { query: { limit: 50 }, more: true }));

// without a store (wallet-cli)
const { data, sourceId } = await accountData.read("balance", ref);
```

## Implementing a source

```ts
export class FullSyncSource implements AccountDataSource {
  readonly id = "full-sync";
  supports(ref: AccountRef) { … }
  async balance(ref: AccountRef) { … }
  async operations(ref: AccountRef) { … }
}
```

Adding a datum to a source is adding a method. Nothing in this package changes.
