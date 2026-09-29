# @features/platform-account-data

> [!WARNING]
> **EXPLORATION** — third iteration of the [account domain migration](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7389904957/Account+domain+migration+discovery) PoC. Nothing here is stable.

The one boundary between the `account-*` entities (what the UI reads) and the implementations that produce the data. It only holds the interface, the router, the `AccountDataProvider` and the fetch helpers (`readThrough`, `isFresh`) shared by the per-entity packages.

```
useAccountBalance(ref) ─► fetchAccountBalance ─► router.resolve("getBalances", ref) ─► source
(platform-account-balance)                        first source that supports(ref)
                                                  AND implements the method
```

The read side of each entity lives in its own package: `@features/platform-account-balance` and `@features/platform-account-operations` (`fetchAccount*` thunks and `useAccount*` hooks).

## `AccountDataSource`

```ts
type AccountDataSource = {
  id: string;
  supports(ref: AccountRef): boolean;
  getBalances?(ref, signal?): Promise<AccountBalance[]>;
  getOperations?(ref, { cursor?, limit? }, signal?): Promise<AccountOperationsPage>;
};
```

A source implements what it can. The router falls back to the next source when a method is missing, so a source with balances only sits in front of a full sync that has both.

- `FullSyncSource` (`@ledgerhq/live-common/account-data`) wraps `AccountBridge.sync`, one shared run per account while in flight.
- `createCoinModuleSource` (same place) reads the coin module directly: an address in, rows out.

## Adding an entity

1. A `domain/entity/account-<name>` package (schema, slice, selectors).
2. One optional method on `AccountDataSource`.
3. A `features/platform/account-<name>` package: a `fetchAccount<Name>` thunk on top of `readThrough`, and a hook.
4. The entity reducer in each app. The apps' `account-data-setup` does not change.

## Glue

Apps build the router (`createAccountDataRouter([...sources])`) from their store and mount `<AccountDataProvider router>`. Non-React callers use the router directly.
