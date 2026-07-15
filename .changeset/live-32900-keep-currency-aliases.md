---
"@ledgerhq/cryptoassets": minor
"@domain/entity-currency-crypto": minor
---

`setCryptoCurrenciesStore` now accepts an optional `aliases` map (alias key → canonical id) and registers those keys in the injected by-id index, so legacy alias lookups (e.g. `getCryptoCurrencyById("osmosis")`) keep resolving after injection, matching the bundled map. `@domain/entity-currency-crypto` exposes `CRYPTO_CURRENCY_ALIASES` (`osmosis`→`osmo`, `groestlcoin`→`groestcoin`, `lbry`→`LBRY`) for apps to pass at bootstrap.
