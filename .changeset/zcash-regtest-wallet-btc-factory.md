---
"@ledgerhq/wallet-btc": patch
---

Add the missing `zcash_regtest` case to `cryptoFactory`, so the Zcash regtest currency used by the coin-tester no longer throws in `wallet-btc`'s crypto factory switch.
