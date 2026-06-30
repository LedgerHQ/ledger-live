---
"@ledgerhq/coin-tezos": patch
---

Fix: accumulate storage/baker fees from internal contract sub-transactions onto the initiating operation so that fee-only balance impacts are not silently dropped
