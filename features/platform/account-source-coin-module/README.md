# @features/platform-account-source-coin-module

> [!CAUTION]
> **Status: EXPLORATION.** See [the account data layer](../../../docs/account-data-layer.md).
>
> A suggestion of shape, to be studied and delivered on its own: nothing here is settled.

`createCoinModuleSource(config)`: an account data source that reads straight from a coin module, one `getBalance` for `balance`, one `listOperations` page for `operations`, no full sync.

It never imports live-common. The app injects `loadCoinModule(currencyId)` (live-common's `account-data/coinModulePorts`), the families to serve per kind, and the blacklisted token ids.
