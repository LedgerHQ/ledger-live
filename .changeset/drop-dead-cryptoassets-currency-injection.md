---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-cli": minor
"@ledgerhq/web-tools": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/wallet-btc": minor
"@ledgerhq/live-countervalues": minor
---

Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.
