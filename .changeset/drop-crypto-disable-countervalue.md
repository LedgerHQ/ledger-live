---
"@domain/entity-currency-crypto": minor
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": minor
"@domain/api-aggregated-assets": minor
"live-mobile": minor
---

Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.
