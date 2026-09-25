---
"@domain/entity-currency-crypto": minor
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/coin-zcash": minor
"@ledgerhq/live-common": minor
---

Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.
