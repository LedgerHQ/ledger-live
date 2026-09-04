---
"@ledgerhq/coin-aleo": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<AleoCoinConfig, MemoNotSupported, AleoTransactionIntentData>` — which keeps the precise shape, so a caller sees exactly which methods exist — declaring the eleven the module implements: `broadcast`, `combine`, `craftTransaction`, `craftTransactionData`, `estimateFees`, `getAccountInfo`, `getBalance`, `lastBlock`, `listOperations`, `register` and `validateAddress`.

The nine capabilities Aleo has none of — `call`, `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getStakes`, `getRewards`, `getValidators`, `validateIntent` and `getNextSequence` — are omitted instead of each carrying a `throw new Error("… is not supported")`.

The three optional capabilities the module keeps are the ones that carry Aleo's privacy model, and the declared shape is now what says so: `register` enrolls a view key with the Provable record scanner, `getAccountInfo` reports that scanner's progress — which is what bounds a private balance and history — and `validateAddress` is a real offline check. Their absence and their presence used to look the same from the outside; now `supports()` separates them.

`listOperations` keeps its `throw`: it rejects an `order` other than `desc` and then does its work, which is argument validation on an implemented method rather than an unimplemented capability. Likewise `combine` and `craftTransaction` throw when the context carries no view key.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error.

The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `combine`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
