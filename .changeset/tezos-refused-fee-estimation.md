---
"@ledgerhq/live-common": minor
"@ledgerhq/ledger-wallet-framework": minor
---

Let a family opt into `validatesRefusedEstimation`, so a refused fee estimation reaches `getTransactionStatus` as a field error instead of rejecting `prepareTransaction`. Tezos opts in and bumps `@ledgerhq/coin-tezos` to 13.1.0, which throws on refused estimations.
