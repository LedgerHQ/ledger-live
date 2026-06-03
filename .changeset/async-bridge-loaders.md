---
"@ledgerhq/live-common": minor
---

live-common: switch coin-module loaders to `import()` and make the bridge async (LIVE-29187)

- `coin-modules/loaders.ts` — every entry now uses dynamic `import()` instead of `require()`.
- `coin-modules/registry.ts` — `loadXxxForFamily` helpers are async with a per-family Promise cache (`makeLoaderCache`). Added `getLoadedMockAccountForFamily` (sync, deprecated) backed by the Map filled by `loadMockAccountForFamily` on resolve.
- `bridge/impl.ts` — `getCurrencyBridge`, `getAccountBridge` and `getAccountBridgeByFamily` now return `Promise<...>`. Promise caches are annotated with React `use()` hint fields so the second read returns synchronously.
- `bridge/generic-coin-framework/{signer,accountBridge,currencyBridge,validateAddress}` are async.
- Bridge hooks/consumers (`useAccountBridge`, `useCurrencyBridge`, `useAccountBridgeMany`, `useBridgeTransaction`, `BridgeSync`, `mockHelpers`) drop the temporary sync shims and now `await` (or `.then(...)`) the Promise.
- `mock/account.ts` — added async `genMockAccount(id, { currency, ... })` that pre-loads the family's mock module so `genAccountEnhanceOperations` is applied (fixes cosmos delegations / algorand opt-ins silently dropped by the previous attempt). The sync `genAccount` is renamed `genAccountLegacy` and kept as a deprecated alias.

Migration note for consumers calling the bridge directly:

```diff
- const bridge = getAccountBridge(account);
+ const bridge = await getAccountBridge(account);
```

In React, prefer `useAccountBridge(account)` / `useCurrencyBridge(currency)` — both require a `<Suspense>` boundary in the parent tree.
