---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"@ledgerhq/coin-cardano": minor
---

Register `cardano_testnet` as a supported currency of the Cardano coin module
Apply the Experimental "Custom gap limit" setting to Cardano accounts through the Cardano coin config, over the remote config value
Resync Cardano accounts from scratch when the keychain observable range changes, so payments to newly observed addresses below the sync cursor are not missed

Read the Cardano keychain observable range (address gap limit) from the coin config (`keychainObservableRange`, default 20) instead of the `KEYCHAIN_OBSERVABLE_RANGE` env variable

**Breaking change**: `CardanoConfig` gains the required `keychainObservableRange: number` and `@ledgerhq/coin-cardano` no longer depends on `@ledgerhq/live-env`. A consumer that builds its own config (such as the coin-service) passes it there; `cardanoDefaults` holds the default. In Ledger Wallet, `setCardanoKeychainObservableRangeSource(getter)` lets the app set `keychainObservableRange` from its own settings through `getCardanoCoinConfig`, over the remote config value; a LiveConfig override of `keychainObservableRange` on `config_currency_cardano` (Coin config DevTool) still wins.

Fix Cardano sync sending an empty transaction request when stored addresses go past the gap limit, and scanning one address short when the first address is used