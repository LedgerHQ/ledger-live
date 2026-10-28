---
"@domain/entity-currency-crypto": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
---

Move the explorer URL helpers (`getDefaultExplorerView`, `getTransactionExplorer`, `getAddressExplorer`, `getTokenExplorer`, `getStakePoolExplorer`) from `@ledgerhq/live-common/explorers` to `@domain/entity-currency-crypto`. `getAccountContractExplorer` becomes `getTokenExplorer(view, contractAddress, ownerAddress)` and takes plain strings. All usages are migrated and `@ledgerhq/live-common/explorers` is removed.
