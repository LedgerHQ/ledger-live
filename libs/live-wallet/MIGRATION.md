# live-wallet migration notes

> `@ledgerhq/live-wallet` is **frozen** during the Ledger Sync DDD extraction (LIVE-29793). New sync infrastructure belongs in the packages listed below; this library only receives interim account logic until `@domain/entity-account` exists.

## What moved out

| Former path | New location |
|---|---|
| `src/cloudsync/` | [`shared/cloud-sync`](../../shared/cloud-sync) — `CloudSyncSDK`, cipher, API client |
| `src/walletsync/aggregator.ts` | [`shared/wallet-sync`](../../shared/wallet-sync) — `createAggregator()`, `CloudSyncDataManager` interface |
| `src/walletsync/createWalletSyncWatchLoop.ts` | [`features/platform/wallet-sync`](../../features/platform/wallet-sync) — watch loop, incremental updates, trustchain lifecycle |
| `src/accountName.ts` | [`domain/entity/account-name`](../../domain/entity/account-name) — naming helpers + selectors |
| `src/walletsync/modules/accountNames.ts` | [`domain/entity/account-name`](../../domain/entity/account-name) — slice + `cloudSyncModule.ts` |
| `src/walletsync/modules/recentAddresses.ts` | [`domain/entity/recent-addresses`](../../domain/entity/recent-addresses) — slice + `cloudSyncModule.ts` |
| `src/store.ts` | App reducers — each app now composes the entity slices itself (`renderer/reducers/wallet.ts` on desktop, `reducers/wallet.ts` on mobile) |

## What stays (for now)

| Path | Why |
|---|---|
| [`src/accounts/`](src/accounts/) | Account list sync + `nonImportedAccountInfos` slice. Depends on coin bridges (`@ledgerhq/types-live`) — cannot move to `domain/entity` yet. Will become `@domain/entity-account`. |
| [`src/walletSyncComposition.ts`](src/walletSyncComposition.ts) | Assembles the `accounts` + `accountNames` + `recentAddresses` sync modules into the wallet-sync schema. Lives here until `accounts` moves out. |
| [`src/addAccounts.ts`](src/addAccounts.ts), [`src/ordering.ts`](src/ordering.ts) | Account list helpers bound to coin bridges — same blocker as `src/accounts/`. |
| [`src/liveqr/`](src/liveqr/) | LiveQR import helpers — unrelated to wallet-sync extraction. |

Import account sync via `@ledgerhq/live-wallet/accounts`. Account naming utilities live in `@domain/entity-account-name`.

## Target pattern for sync modules

Each synced data type should live in its own `domain/entity/<name>` package with:

```
schema.ts           # Zod schemas + state types
slice.ts            # RTK reducer (when app state is needed)
selectors.ts        # Read helpers
cloudSyncModule.ts # CloudSyncDataManager implementation
```

See [`domain/entity/account-name`](../../domain/entity/account-name) and [`domain/entity/recent-addresses`](../../domain/entity/recent-addresses) for reference implementations.

## Full stack documentation

See [`docs/ledger-sync/README.md`](../../docs/ledger-sync/README.md) for the layered architecture (Hardware → TrustchainSDK → CloudSync → WalletSync → Apps).
