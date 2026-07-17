---
"@ledgerhq/wallet-cli": minor
"@ledgerhq/coin-modules-monitoring": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-aleo": minor
"@ledgerhq/coin-hedera": minor
"@ledgerhq/coin-tester-evm": minor
---

Build the CAL client store via `buildStandaloneCryptoAssetsStore` (`@features/platform-currencies`) instead of the legacy `setupCalClientStore` test-helper from `@ledgerhq/cryptoassets`. Callers now resolve `CAL_SERVICE_URL` / `LEDGER_CLIENT_VERSION` from the environment and inject the built store explicitly (the standalone builder does not auto-inject the global). No runtime behaviour change.
