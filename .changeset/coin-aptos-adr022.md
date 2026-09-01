---
"@ledgerhq/coin-aptos": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<AptosCoinConfig>` — which keeps the precise shape, so a caller sees exactly which methods exist — declaring the nine the module implements: `broadcast`, `combine`, `craftTransaction`, `craftTransactionData`, `estimateFees`, `getBalance`, `lastBlock`, `listOperations` and `validateAddress`.

The ten capabilities Aptos has none of — `call`, `register`, `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getStakes`, `getRewards`, `getValidators`, `validateIntent` and `getNextSequence` — are omitted instead of each carrying a `throw new Error("… is not supported")`. `validateAddress` is the one capability that stays, because it is a real offline check on the address shape rather than a placeholder; keeping it in the declared shape is what tells a caller the difference.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — except that the default throws synchronously where several of the stubs it replaces were `async` functions returning a rejected promise. `supports(method)` now reports which capabilities are real.

The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `estimateFees` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.
