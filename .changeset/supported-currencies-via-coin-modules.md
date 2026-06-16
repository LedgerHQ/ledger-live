---
"@ledgerhq/live-common": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-env": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-cli": patch
"@ledgerhq/wallet-cli": patch
"@ledgerhq/web-tools": patch
---

Derive "supported currencies" from the coin-modules registry instead of `setSupportedCurrencies`.

Each `CoinModuleLoader` now declares a `supportedCoins: CryptoCurrencyId[]` field, and a currency is supported when it appears in a registered loader's `supportedCoins`. The framework `setSupportedCurrencies` / `listSupportedCurrencies` / `isCurrencySupported` and the `EXPERIMENTAL_CURRENCIES` env are removed; `listSupportedCurrencies` / `isCurrencySupported` are now exported from `@ledgerhq/live-common/currencies` backed by the registry. Apps no longer maintain a supported-currencies list — registering the coin modules is what makes their currencies supported.
