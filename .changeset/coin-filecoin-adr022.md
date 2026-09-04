---
"@ledgerhq/coin-filecoin": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns an object checked against `CoinModuleImpl` with `satisfies` — which keeps the precise shape, so a caller sees exactly which methods exist — declaring the eleven the module implements — `broadcast`, `combine`, `craftTransaction`, `craftTransactionData`, `estimateFees`, `getBalance`, `getNextSequence`, `lastBlock`, `listOperations`, `validateAddress`, `validateIntent`. The eight capabilities Filecoin has none of — `call`, `register`, `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getStakes`, `getRewards`, `getValidators` — are omitted instead of each carrying a `throw new Error("… is not supported")`.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real rather than being unable to tell a placeholder from an implementation.

The API integration test exercises the module the way a consumer does, through `withDefaults`, and additionally asserts that the module itself no longer carries the eight omitted methods.
