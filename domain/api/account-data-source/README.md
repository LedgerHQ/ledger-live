# @domain/api-account-data-source

> [!CAUTION]
> **Status: UNSTABLE.** API may change while the first sources plug in.

The source contract, the router that picks a source per account, and the generic read into an entity slice.

- `AccountDataSource`: an `id`, a pure synchronous `supports(descriptor, kind)`, and per kind a single reader under `read` or a batch reader under `readBatch` (with both, `readBatch` is always used). Optional `maxBatchSize` and `concurrency`.
- `createAccountDataRouter(sources, { concurrency })`: `read(kind, descriptor, options)` and `readBatch(kind, descriptors, options)`. The first ranked source with a reader for the kind that supports the account answers.
- `accountDataExtra(sources)`: the router as the `accountData` entry of the thunk `extraArgument`.
- `fetchAccountData(binding, descriptor, options)` and `fetchAccountDataBatch(binding, descriptors, options)`: thunks reading into the entity slice through its binding, guarded by freshness and by a read already in flight.
- `NoAccountDataSourceError`, `AccountDataAbortedError`, `AccountDataRouterMissingError`.
- `./testing`: two toy kinds (`counter`, `feed`), their bindings and a store, for the tests of other packages.

See [the account data layer](../../../docs/account-data-layer.md) for the read flow and how to add a source.
