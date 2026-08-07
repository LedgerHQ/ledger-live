---
"@ledgerhq/live-wallet": major
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/wallet-cli": patch
---

Scope `@ledgerhq/live-wallet` down to wallet sync only

The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
`ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
`accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
`accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
`accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.
