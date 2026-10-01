# @features/platform-account-source-coin-module

> [!CAUTION]
> **Status: UNSTABLE** — New package; API still being designed.

An account data source that will read straight from a coin module (`getBalance`, `listOperations`), without a full sync.

## Responsibility

`CoinModuleSource` implements `AccountDataSource` from
[`@domain/api-account-data-source`](../../../domain/api/account-data-source). It is an empty shell:
it has no datum method and `supports` returns `false`, so the router always falls through. Methods
arrive with the first `@domain/entity-account-*` slices.
