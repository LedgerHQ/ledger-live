---
"@ledgerhq/coin-solana": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
---

fix(coin-solana): partition the native balance between the system account and the stake accounts, summed by the generic adapter through `partitionsNativeBalance` and the family's `getHeldNativeAmount`, so delegated SOL is counted once
