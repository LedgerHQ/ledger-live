# @domain/entity-recent-addresses

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Schemas, RTK slice, in-memory store and WalletSync module for recently used recipient addresses.

State shape: `recentAddresses: RecentAddressesState`.

- `schema.ts` — canonical Zod schemas and the inferred `RecentAddress` / `RecentAddressesState` types. `RecentAddressSchema` accepts the current format plus two legacy ones (plain string, and the nested shape produced by a past broken migration) so persisted state is recovered rather than dropped.
- `slice.ts` — `recentAddressesSlice` and the `updateRecentAddresses` action.
- `store.ts` — `RecentAddressesStore`, the process-wide in-memory instance (`setupRecentAddressesStore` / `getRecentAddressesStore`), and `connectRecentAddressesStore`, which mirrors it into a Redux store. Apps call `connectRecentAddressesStore(store, recentAddressesSelector)` once at startup.
- `cloudSyncModule.ts` — `recentAddressesSyncModule`, a `CloudSyncDataManager` that syncs recent addresses across devices via `@shared/cloud-sync-module`. Its distant format is index-based and separate from the local one.

## Related documentation

- [CloudSyncDataManager](../../../docs/ledger-sync/05-wallet-sync-data-manager.md) — module contract and reconciliation
- [Cookbook: add a module](../../../docs/ledger-sync/cookbook.md) — hands-on guide for new sync modules
- [App integration](../../../docs/ledger-sync/07-app-integration.md) — how recent addresses are wired in Redux
