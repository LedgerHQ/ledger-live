# Accounts

Account list sync for WalletSync. Import everything from `@ledgerhq/live-wallet/accounts`.

## Contents

| File | Role |
|---|---|
| `schema.ts` | `AccountDescriptor` / `NonImportedAccountInfo` types and related state shapes |
| `slice.ts` | RTK slice for `nonImportedAccountInfos` (accounts present in cloud sync but not yet imported locally) |
| `descriptorToAccount.ts` | Rehydrates an `Account` skeleton from a synced `AccountDescriptor`, to be completed by the first sync |
| `cloudSyncModule.ts` | `CloudSyncDataManager` for account descriptors — syncs the account list across devices |

## Related documentation

- [CloudSyncDataManager concepts](../../../docs/ledger-sync/05-wallet-sync-data-manager.md) — module contract, accounts reconciliation, `nonImportedAccountInfos` flow
- [Behaviour scenarios](../../../docs/ledger-sync/scenarios.md) — guaranteed behaviours including non-imported account retry
- [App integration](../../../docs/ledger-sync/07-app-integration.md) — how apps wire the accounts module into Redux
