---
"@ledgerhq/coin-cardano": major
"@ledgerhq/live-common": minor
---

Read the Cardano keychain observable range (address gap limit) from the coin config (`keychainObservableRange`, default 20) instead of the `KEYCHAIN_OBSERVABLE_RANGE` env variable

**Breaking change**: `CardanoConfig` gains the required `keychainObservableRange: number` and `@ledgerhq/coin-cardano` no longer depends on `@ledgerhq/live-env`. A consumer that builds its own config (such as the coin-service) passes it there; `cardanoDefaults` holds the default. In Ledger Wallet, `setCardanoKeychainObservableRangeSource(getter)` lets the app set `keychainObservableRange` from its own settings through `getCardanoCoinConfig`, over the remote config value; a LiveConfig override of `keychainObservableRange` on `config_currency_cardano` (Coin config DevTool) still wins.
