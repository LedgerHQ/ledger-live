# @shared/cloud-sync-module

> **Status: UNSTABLE** — This package is incrementally shipping the validated CloudSync DDD architecture; API may change.

Context-free aggregation core for Ledger Live cloud synchronisation.

Exports `createAggregator()` which composes a list of `CloudSyncDataManager` modules (accounts, accountNames, recentAddresses, …) into a single aggregated schema, diff, incremental-update resolver and apply function. Has no knowledge of Redux, React or networking — it is a pure data-transformation layer.

The `CloudSyncDataManager<LocalState, Update, Schema>` interface describes the contract each sync module must implement.

## Related documentation

- [CloudSyncDataManager](./../../docs/ledger-sync/05-wallet-sync-data-manager.md) — concepts, module contract, accounts reconciliation
- [The watch loop](./../../docs/ledger-sync/06-watch-loop.md) — how aggregation feeds the continuous sync loop
- [Cookbook: add a module](./../../docs/ledger-sync/cookbook.md) — hands-on module authoring guide

## Implementation locations

| Module | Package |
|---|---|
| accounts | [`@ledgerhq/live-wallet/accounts`](../../libs/live-wallet/src/accounts/) (interim) |
| accountNames | [`@domain/entity-account-name`](../../domain/entity/account-name) |
| recentAddresses | [`@domain/entity-recent-addresses`](../../domain/entity/recent-addresses) |
