# @domain/api-account-data

> [!CAUTION]
> **Status: UNSTABLE.** API may change while the first sources plug in.

The source contract, the router that picks a source per account, and the thunks that read into the slices.

- `AccountDataSource`: an `id`, a pure synchronous `supports(descriptor, kind)`, the descriptor `purposes` it serves (`account` by default), and per kind a single reader under `read` or a batch reader under `readBatch` (with both, `readBatch` is always used). Optional `maxBatchSize` and `concurrency`.
- `createAccountDataRouter(sources, { concurrency })`: `read(kind, descriptor, { query, sourceId, cursor })`. The first ranked source with a reader for the kind that supports the account answers; reads of one tick are batched per source. `addSource(source)` ranks a source loaded on demand last (or in place of the one sharing its id) and returns its remover.
- `accountDataExtra(sources)`: the router as the `accountData` entry of the thunk `extraArgument`.
- `addAccountDataSource(source)`: a thunk adding a source to the store's router, for a devtool that cannot reach the app's setup.
- `fetchAccountData(kind, descriptor, { query, maxAge })` and `fetchMoreAccountData(kind, descriptor, { query })`: head read and next page, guarded by freshness and by the read in flight.
- `NoAccountDataSourceError`, `AccountDataRouterMissingError`.
- `./testing`: two toy kinds (`counter`, `feed`) and a store, for the tests of other packages.

See [the account data layer](../../../docs/account-data-layer.md) for the read flow and how to add a source.
