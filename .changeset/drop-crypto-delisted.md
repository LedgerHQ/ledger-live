---
"@domain/entity-currency-crypto": minor
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": minor
"@features/platform-contacts": minor
---

Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.
