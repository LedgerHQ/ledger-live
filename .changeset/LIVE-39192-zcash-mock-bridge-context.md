---
"@ledgerhq/live-common": patch
---

The Zcash mock bridge builds `getTransactionStatus`, `prepareTransaction` and `estimateMaxSpendable` with the currency's coin config, like the real bridge.
