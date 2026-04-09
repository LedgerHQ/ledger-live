---
"@ledgerhq/live-common": minor
---

Replace generated/ barrel files with a synchronous require()-based coin module registry.

- Introduces `src/coin-modules/` with `registry.ts`, `loaders.ts`, `types.ts`, and `load-all-coins.ts`
- Deletes 12 `generated/` barrel files (bridge/js, bridge/mock, transaction, hw-getAddress, hw-signMessage, deviceTransactionConfig, walletApiAdapter, platformAdapter, account, specs, cli-transaction, mock)
- All public APIs (`getCurrencyBridge`, `getAccountBridge`, `fromTransactionRaw`, etc.) remain synchronous — non-breaking
- App setup files call `registerAllCoins()` to register coin module loaders, then `setSupportedCurrencies()` separately to control which currencies are enabled
