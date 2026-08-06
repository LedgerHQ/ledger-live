---
"@ledgerhq/live-wallet": major
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
"@ledgerhq/wallet-cli": patch
"@domain/entity-wallet-sync": minor
---

Complete the WalletSync DDD extraction: apps now compose the DDD slices directly

`@ledgerhq/live-wallet` no longer owns sync infrastructure. `src/cloudsync/`, `src/walletsync/`,
`src/accountName.ts` and `src/store.ts` are removed in favour of `@shared/cloud-sync`,
`@shared/wallet-sync`, `@features/platform-wallet-sync`, `@domain/entity-account-name` and
`@domain/entity-recent-addresses`. What remains is account-list logic (`src/accounts/`,
`src/addAccounts.ts`, `src/ordering.ts`, `src/liveqr/`) plus `src/walletSyncComposition.ts`, which
assembles the sync modules into the wallet-sync schema — see `libs/live-wallet/MIGRATION.md`.

Desktop and mobile replace the monolithic `wallet` reducer with a `combineReducers` of the entity
slices (`accountNames`, `starredAccountIds`, `walletSync`, `recentAddresses`, `nonImportedAccountInfos`)
and wire the watch loop and trustchain lifecycle from `@features/platform-wallet-sync` at bootstrap.
`@ledgerhq/live-common` drops its `@ledgerhq/live-wallet` runtime dependency: the wallet-api,
platform and CSV-export helpers now take an `AccountNamesState` instead of the whole `WalletState`.
