---
"@ledgerhq/live-common": patch
"@ledgerhq/ledger-wallet-framework": patch
"@ledgerhq/coin-celo": patch
"@ledgerhq/coin-cosmos": patch
"@ledgerhq/coin-hedera": patch
"@ledgerhq/web-tools": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Scale BigNumber amounts down by a power of ten with `shiftedBy` instead of `div`, so the result no longer depends on the global `DECIMAL_PLACES`
