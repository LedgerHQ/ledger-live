---
"@features/platform-coin-observability": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Make `DEFAULT_METHOD_TIERS` a whitelist of the observed coin-module methods: a method it does not list is `off` unless the `coinObservability` flag gives it a tier, and live-common no longer checks at compile time that it names every method of the contract, so a coin-module-framework release that adds a method no longer breaks the build.
