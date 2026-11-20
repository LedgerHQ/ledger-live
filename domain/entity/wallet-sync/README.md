# @domain/entity-wallet-sync

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

RTK slice for WalletSync protocol state (distant data + version).

State shape: `{ walletSyncState: WSState }`. Tracks the current sync status (version, distant state blob). Exports `walletSyncSlice`, action `walletSyncUpdate` and selector `selectWalletSyncState`, which reads the slice at `wallet.walletSync`, where both apps mount it.

> Account-related sync state (`nonImportedAccountInfos`) lives in [`@ledgerhq/live-wallet/accounts`](../../../libs/live-wallet/src/accounts/) until `@domain/entity-account` exists.

## Related documentation

- [CloudSyncDataManager](../../../docs/ledger-sync/05-wallet-sync-data-manager.md) — modular reconciliation layer
- [The watch loop](../../../docs/ledger-sync/06-watch-loop.md) — continuous sync lifecycle
- [App integration](../../../docs/ledger-sync/07-app-integration.md) — Redux wiring in Desktop & Mobile
