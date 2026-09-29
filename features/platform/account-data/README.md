# @features/platform-account-data

> [!WARNING]
> **EXPLORATION** — protocol variant of the account-data PoC. See [docs/account-data-layer.md](../../../docs/account-data-layer.md).

The React glue of the account data protocol, and nothing else.

```ts
const { refresh, loadMore } = useAccountData(accountOperationsBinding, accountRefOf(account));
const operations = useSelector((state: State) => selectAccountOperations(state, accountId));
```

`useAccountData(binding, ref, { maxAge? })` reads the datum on mount and when the ref changes, and returns `refresh` (plus `loadMore` when the binding paginates). The data itself is read with the entity's own selectors. It knows no slice and no source.
