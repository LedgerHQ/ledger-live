# Accounts (interim)

> **Status: interim** — this folder holds account-related state and sync logic until a `@domain/entity-account` package exists. See [MIGRATION.md](../../MIGRATION.md).

## Contents

| File | Role |
|---|---|
| `schema.ts` | `NonImportedAccountInfo` type and related state shapes |
| `slice.ts` | RTK slice for `nonImportedAccountInfos` (accounts present in cloud sync but not yet imported locally) |
| `cloudSyncModule.ts` | `CloudSyncDataManager` for account descriptors — syncs the account list across devices |

## Related documentation

- [CloudSyncDataManager concepts](../../../docs/ledger-sync/05-wallet-sync-data-manager.md) — module contract, accounts reconciliation, `nonImportedAccountInfos` flow
- [Behaviour scenarios](../../../docs/ledger-sync/scenarios.md) — guaranteed behaviours including non-imported account retry
- [App integration](../../../docs/ledger-sync/07-app-integration.md) — how apps wire the accounts module into Redux

## Future

When `@domain/entity-account` is introduced, `schema.ts`, `slice.ts` and `cloudSyncModule.ts` will move there. Until then, import everything from `@ledgerhq/live-wallet/accounts`.
