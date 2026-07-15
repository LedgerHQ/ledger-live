---
"@ledgerhq/cryptoassets": minor
---

Fix dead keyword tiebreak in registerCurrencyInStore: case-insensitive comparison so findCryptoCurrencyByTicker resolves ambiguous tickers (ETH, BNB, DOT, XTZ, CRO) order-independently
