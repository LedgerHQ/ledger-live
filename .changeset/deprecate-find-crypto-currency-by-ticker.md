---
"@ledgerhq/cryptoassets": patch
---

Mark findCryptoCurrencyByTicker as @deprecated: tickers are not unique so the lookup is ambiguous. Use findCryptoCurrencyById instead.
