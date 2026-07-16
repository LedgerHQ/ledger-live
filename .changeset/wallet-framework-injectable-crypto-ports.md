---
"@ledgerhq/ledger-wallet-framework": minor
---

Remove `@ledgerhq/cryptoassets` (value import) from the framework's production dependency surface. The framework now declares injectable port types (`CurrenciesResolver`, `FrameworkCryptoAssetsStore`) that the application composition root wires at bootstrap via `setCurrenciesResolver()` and `setCryptoAssetsStore()`.
