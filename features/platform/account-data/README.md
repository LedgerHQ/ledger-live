# @features/platform-account-data

> [!CAUTION]
> **Status: EXPLORATION** — API still being designed.

The React glue for account data, and nothing else.

## Responsibility

`useAccountData(binding, ref, { maxAge, query })` keeps one datum of one account read while mounted,
through `fetchAccountData` from [`@domain/api-account-data-source`](../../../domain/api/account-data-source).
It returns `pending`, `refresh` and, on a paginated datum only, `loadMore`.

The data is read with the entity's own selectors. The hook drives the read, it does not own the data.

```ts
const { pending, loadMore } = useAccountData(accountOperationsBinding, ref, { query: { limit: 50 } });
const operations = useSelector(state => selectAccountOperations(state, ref.accountId));
```

This package knows no slice and no source. Adding a datum changes nothing here.
