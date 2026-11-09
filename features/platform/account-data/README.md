# @features/platform-account-data

> [!CAUTION]
> **Status: UNSTABLE.** API may change while the first screens adopt it.

`useAccountData(kind, descriptor, { query, maxAge })` keeps one kind of data of one account read while mounted, and returns `{ accountUUID, pending, error, hasMore, refresh, loadMore }`. The screen reads the data with the entity's own selectors:

```ts
const query = { filterAsset: usdtId };
const { accountUUID, hasMore, loadMore } = useAccountData("operations", descriptor, { query });
const operations = useSelector(state => selectAccountOperations(state, accountUUID, query));
```

`useAccountDataBatch(kind, descriptors, { query, maxAge })` does the same for many accounts, for a figure that sums them (a portfolio total). It reads them in one tick, so the router groups them per source: one call per chunk of `maxBatchSize` on a source with a batch reader, else at most `concurrency` single reads at once, and returns `{ accountUUIDs, pending, errors, refresh }`:

```ts
const { pending } = useAccountDataBatch("balance", descriptors);
const total = useSelector(state => selectTotal(state, descriptors));
```

See [the account data layer](../../../docs/account-data-layer.md).
