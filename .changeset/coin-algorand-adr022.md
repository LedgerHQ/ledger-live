---
"@ledgerhq/coin-algorand": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<AlgorandCoinConfig, AlgorandMemo>` — which keeps the precise shape, so a caller sees exactly which methods exist — declaring the eleven the module implements: `broadcast`, `combine`, `craftTransaction`, `craftTransactionData`, `estimateFees`, `getBalance`, `getBlockInfo`, `lastBlock`, `listOperations`, `validateAddress` and `validateIntent`.

The eight capabilities Algorand has none of are omitted instead of each carrying a `throw new Error("… is not supported for Algorand")`: `call`, `register`, `craftRawTransaction`, `getBlock`, `getStakes`, `getRewards` and `getValidators` were all flagged as unsupported, and `getNextSequence` as not applicable to Algorand.

Block queries are a good illustration of why capabilities are per-method rather than a group: the module keeps `getBlockInfo`, which it implements against the node, and omits only `getBlock`. `validateIntent` and `validateAddress` likewise stay, being real implementations rather than placeholders — and the declared shape is now what tells a caller the difference.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises a `"<method> is not supported"` error — with the framework's generic wording now, since the message no longer comes from a per-module stub, and thrown synchronously where the `call` and `register` stubs it replaces were `async` functions returning a rejected promise. `supports(method)` now reports which capabilities are real.

The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `combine`, `craftTransaction`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
