---
"@ledgerhq/cryptoassets": minor
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/wallet-cli": patch
"@ledgerhq/web-tools": patch
---

Make the `@ledgerhq/cryptoassets` fiat registry injectable (`setFiatCurrenciesStore`) and inject the `@domain/entity-currency-fiat` registry at each app's bootstrap, so the domain registry is the single runtime source of truth for fiat currency data. The bundled fiat list stays as the fallback and is kept in sync by the existing parity test.
