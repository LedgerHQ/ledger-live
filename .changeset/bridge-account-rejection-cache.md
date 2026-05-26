---
"@ledgerhq/live-common": patch
---

Make `getAccountBridge` return an identity-stable, annotated rejected Promise when `checkAccountSupported` fails so `React.use()` no longer loops on unsupported accounts. Export `clearBridgeCache(family?)` for callers that need to invalidate after toggling `setSupportedCurrencies` / experimental currencies. Family-level caches (`currencyBridge`, `accountBridge`, `mockBridge`) keep rejections cached too — eviction would hand React a fresh Promise per render and re-suspend forever; use `clearBridgeCache` to retry after a transient load failure.
