# @domain/entity-recent-addresses

> **Status: UNSTABLE** — This package is incrementally shipping the validated WalletSync DDD architecture; API may change.

RTK slice and WalletSync module for recently used receive addresses.

State shape: `recentAddresses: RecentAddressesState`. Exports `recentAddressesSlice`, action `updateRecentAddresses` and `recentAddressesSyncModule` — a `CloudSyncDataManager` that syncs recent addresses across devices via `@shared/cloud-sync-module`.

## Related documentation

- [CloudSyncDataManager](../../../docs/ledger-sync/05-wallet-sync-data-manager.md) — module contract and reconciliation
- [Cookbook: add a module](../../../docs/ledger-sync/cookbook.md) — hands-on guide for new sync modules
- [App integration](../../../docs/ledger-sync/07-app-integration.md) — how recent addresses are wired in Redux
