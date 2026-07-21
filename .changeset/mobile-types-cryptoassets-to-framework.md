---
"@ledgerhq/ledger-wallet-framework": minor
"live-mobile": minor
---

Repoint `ledger-live-mobile` currency type imports off `@ledgerhq/types-cryptoassets`:
- App-layer code (components, screens, reducers, mvvm, hooks) → `@domain/entity-currency`
- Coin-family code (`families/`) → `@ledgerhq/ledger-wallet-framework/types`

Framework: add `CryptoOrTokenCurrency = CryptoCurrency | TokenCurrency` type and explicit `./types` subpath export.
