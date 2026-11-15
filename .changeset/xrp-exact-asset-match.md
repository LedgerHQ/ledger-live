---
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": patch
---

Match XRP token operations on their exact currency code, so `USD` and `usd` operations stay in separate token accounts, and zero a removed token while a token with the same code is still held. Add the `exactAssetMatch` bridge option.
