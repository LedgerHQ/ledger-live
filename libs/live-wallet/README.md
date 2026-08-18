# @ledgerhq/live-wallet

> [!WARNING]
> **Status: DEPRECATED** — Maintenance mode, scheduled to become `@domain/entity-account`; do not add anything here.

Wallet sync for the account list. This package is scoped to that single concern:

| Path | Role |
|---|---|
| [`src/accounts/`](src/accounts/) | Account list sync module + the `nonImportedAccountInfos` state |
| [`src/walletSyncComposition.ts`](src/walletSyncComposition.ts) | Assembles the `accounts`, `accountNames` and `recentAddresses` modules into the wallet-sync schema |

**Full Ledger Sync stack documentation:** [`docs/ledger-sync`](../../docs/ledger-sync/README.md)

## Why it still lives here

Everything else about account user data already sits in the DDD layers — account names in
[`domain/entity/account-name`](../../domain/entity/account-name), starred state in
[`domain/entity/starred-account`](../../domain/entity/starred-account), recent receive addresses in
[`domain/entity/recent-addresses`](../../domain/entity/recent-addresses).

The account list cannot follow yet: syncing it means turning a synced descriptor into a real
`Account` and running a coin bridge over it, so this code depends on `@ledgerhq/types-live`, which
`domain/entity` packages must not import. It moves to `@domain/entity-account` once that constraint
is lifted. `walletSyncComposition.ts` follows it, since it only exists to compose the `accounts`
module with the entity modules.

Reducers and actions are written in the style of Redux, without depending on Redux itself. Apps
inject the bridge context via `bindCtx()`.
