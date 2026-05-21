---
"@ledgerhq/live-common": minor
"@ledgerhq/live-wallet": minor
"@ledgerhq/coin-modules-monitoring": minor
"@ledgerhq/coin-tester-evm": minor
"@ledgerhq/coin-tester-solana": minor
"@ledgerhq/web-tools": minor
"@ledgerhq/live-cli": minor
"live-mobile": minor
---

chore: async prep — toOperationRaw, toSignedOperationRaw and remaining bridge callers (LIVE-29186)

Make `toOperationRaw`, `toSignedOperationRaw` and `toSignOperationEventRaw` async in `@ledgerhq/live-common`,
widen `WalletSyncDataManagerResolutionContext.getAccountBridge` in `@ledgerhq/live-wallet` to accept a Promise,
and update remaining callers (apps/cli, apps/wallet-cli, apps/web-tools, mobile concordium, coin-tester-evm/solana,
coin-modules-monitoring) to `await` the bridge.
