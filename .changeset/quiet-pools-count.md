---
"@ledgerhq/coin-near": minor
"@ledgerhq/live-common": minor
"@ledgerhq/ledger-wallet-framework": minor
---

fix(coin-near): partition the native balance between the liquid funds and the staking positions, summed by the generic adapter through `partitionsNativeBalance`, so staked NEAR is counted once
