---
"@ledgerhq/cryptoassets": patch
---

Don't use `0` address for evm currencies to avoid gas estimation error in swap when interacting with smart contracts (swapping from token accounts)
