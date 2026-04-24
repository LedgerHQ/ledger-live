---
"@ledgerhq/live-common": minor
"@ledgerhq/wallet-cli": minor
"@ledgerhq/coin-tester-evm": minor
---

Remove direct runtime imports of `@ledgerhq/coin-*` packages from shared live-common code (`account/helpers`, `operation`, `bridge/generic-alpaca/validateAddress`); all coin-specific behaviour is now deferred via the `coinModuleLoaders` registry. wallet-cli no longer needs the tronweb proto polyfill as a side effect.
