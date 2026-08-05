---
"@ledgerhq/coin-vechain": minor
"@ledgerhq/live-common": minor
---

Make the VeChain chain tag configurable through the currency LiveConfig (`config_currency_vechain.chainTag`) instead of hardcoding mainnet. The value is read via a single `getChainTag()` helper that validates it to an integer single byte (0–255) and falls back to the mainnet tag (74) on an invalid remote override; live-common ships the mainnet tag as the production default. This lets the coin-tester drive a Thor solo network's generated genesis tag without patching the coin module.
