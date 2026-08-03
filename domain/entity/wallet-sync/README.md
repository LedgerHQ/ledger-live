# @domain/entity-wallet-sync

> **Status: UNSTABLE** — This package is incrementally shipping the validated WalletSync DDD architecture; API may change.

RTK slice for WalletSync protocol state (distant data + version).

State shape: `{ walletSyncState: WSState }`. Tracks the current sync status (version, distant state blob). Exports `walletSyncSlice`, action `walletSyncUpdate` and selector `walletSyncStateSelector`.

> Account-related sync state (`nonImportedAccountInfos`) lives in [`@ledgerhq/live-wallet/accounts`](../../../libs/live-wallet/src/accounts/) until `@domain/entity-account` exists.

## Related documentation

- [WalletSyncDataManager](../../../docs/ledger-sync/05-wallet-sync-data-manager.md) — modular reconciliation layer
- [The watch loop](../../../docs/ledger-sync/06-watch-loop.md) — continuous sync lifecycle
- [App integration](../../../docs/ledger-sync/07-app-integration.md) — Redux wiring in Desktop & Mobile
