---
"@domain/entity-currency-fiat": minor
---

Add list and search accessors to `@domain/entity-currency-fiat`: `listFiatCurrencies`, `hasFiatCurrencyTicker`, and `findFiatCurrencyByTicker` (returns `undefined` on miss). Rename the previous `getFiatCurrencyByTicker` (find-semantics) to `findFiatCurrencyByTicker`; the new `getFiatCurrencyByTicker` now throws on a miss, matching the legacy `@ledgerhq/cryptoassets` semantics.
