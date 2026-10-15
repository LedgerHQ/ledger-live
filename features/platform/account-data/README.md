# @features/platform-account-data

> [!CAUTION]
> **Status: UNSTABLE.** API may change while the first screens adopt it.

`useAccountData(binding, descriptor, { query, maxAge })` keeps one kind of data of one account read while mounted, and returns `{ accountUUID, pending, refresh, loadMore }` (`loadMore` on a paginated kind only). The screen reads the data with the entity's own selectors:

```ts
const { accountUUID, loadMore } = useAccountData(accountOperationsBinding, descriptor, {
  query: { limit: 50 },
});
const operations = useSelector(state => selectAccountOperations(state, accountUUID));
```

See [the account data layer](../../../docs/account-data-layer.md).
