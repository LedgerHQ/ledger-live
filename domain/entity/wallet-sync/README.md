# @domain/entity-wallet-sync

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

RTK slice for WalletSync protocol state.

`walletSyncState` persists the last distant document, version, and optional backend environment.
The environment is cursor provenance, not the active session environment; the latter lives in the
Trustchain store. Legacy untagged cursors adopt the active environment on first reconciliation.

The sibling `isHydrated` flag is transient. Apps mark persistence hydration complete, reconcile the
cursor against the active Trustchain environment, and start the watch loop only after both
environments match. A mismatch clears the distant document and resets its version before the first
request.

> Account-related sync state (`nonImportedAccountInfos`) lives in [`@ledgerhq/live-wallet/accounts`](../../../libs/live-wallet/src/accounts/) until `@domain/entity-account` exists.

## Related documentation

- [CloudSyncDataManager](../../../docs/ledger-sync/05-wallet-sync-data-manager.md) — modular reconciliation layer
- [The watch loop](../../../docs/ledger-sync/06-watch-loop.md) — continuous sync lifecycle
- [App integration](../../../docs/ledger-sync/07-app-integration.md) — Redux wiring in Desktop & Mobile
