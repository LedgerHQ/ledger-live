# @domain/api-account-data-source

> [!CAUTION]
> **Status: EXPLORATION.** API still being designed.

The account data **protocol**, implementation side, and the one generic read.

## Responsibility

- `AccountDataSource`: what a source implements: an `id`, `supports(ref, datum)`, and for each
  datum of [`AccountData`](../../entity/account-data) a single reader named after it, a batch reader
  under `batch`, or both. Optional `maxBatchSize` and `concurrency` tell the router how to call it.
- `createAccountDataRouter(sources, { coalesce, concurrency })`: the app ranks its sources; for each
  account, the first that has a reader for the datum and supports the ref answers.
  - `read(datum, ref, query, { signal, sourceId })` returns the data and which source gave it. Reads
    issued in the same tick are merged into one batch per source (`coalesce`, on by default).
  - `readBatch(datum, refs, query, { signal })` returns one settled `{ data, sourceId }` per ref.
  - Each source gets one call per chunk through its batch reader, or one call per account through
    its single reader, never more than its `concurrency` (default 4) at once, across all reads.
- `fetchAccountData(binding, ref, options)`: the thunk that reads any datum into its slice, through
  the router found in the thunk `extraArgument` under `accountData`. Head reads are guarded by
  freshness (`maxAge`) and by an in-flight read of the same ref. A next page (`more: true`) is guarded
  by the pending flag only, and pinned to the source that answered the head.
- `fetchAccountDataBatch(binding, refs, options)`: the same for many accounts in one router call,
  with the same guards per ref and the same in-flight table. Head reads only.
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

// many accounts: one call per source
await dispatch(fetchAccountDataBatch(accountBalanceBinding, refs));

// without a store (wallet-cli)
const { data, sourceId } = await accountData.read("balance", ref);
const answers = await accountData.readBatch("balance", refs);
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

A source that can read many accounts in one call adds a batch reader. In a class, type it
explicitly, since `implements` does not type property initialisers:

```ts
export class PortfolioSource implements AccountDataSource {
  readonly id = "portfolio";
  readonly maxBatchSize = 100;
  supports(ref: AccountRef, datum: AccountDatum) { … }
  readonly batch: AccountDataSource["batch"] = {
    balance: async refs => refs.map(ref => ({ status: "fulfilled", value: … })),
  };
}
```

Adding a datum to a source is adding a method. Nothing in this package changes. `id`, `supports`,
`batch`, `maxBatchSize` and `concurrency` are reserved: no datum may use those names.
