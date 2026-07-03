---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-cli": minor
"@ledgerhq/web-tools": minor
---

Inject the domain-backed crypto-currency registry (`@domain/entity-currency-crypto`) at app bootstrap via `setCryptoCurrenciesStore`, making the domain registry the runtime source of truth for currency data. The bundled data in `@ledgerhq/cryptoassets` stays as the fallback.
