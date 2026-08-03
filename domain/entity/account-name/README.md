# @domain/entity-account-name

> **Status: UNSTABLE** — This package is incrementally shipping the validated WalletSync DDD architecture; API may change.

RTK slice and WalletSync module for user-defined account names.

State shape: `accountNames: Map<string, string>` (accountId → name). Exports `accountNamesSlice`, actions (`setAccountName`, `bulkSetAccountNames`, `setNamesForAccounts`, `initFromUserData`), selectors (`accountNameSelector`, `accountNameWithDefaultSelector`) and `accountNamesSyncModule` — a `CloudSyncDataManager` that syncs account names across devices via `@shared/cloud-sync-module`.

## Related documentation

- [CloudSyncDataManager](../../../docs/ledger-sync/05-wallet-sync-data-manager.md) — module contract and reconciliation
- [Cookbook: add a module](../../../docs/ledger-sync/cookbook.md) — hands-on guide for new sync modules
- [App integration](../../../docs/ledger-sync/07-app-integration.md) — how account names are wired in Redux
