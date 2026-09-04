---
"@ledgerhq/coin-polkadot": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<…>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the ten capabilities the chain has none of, `call`, `register`, `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getStakes`, `getRewards`, `getValidators`, `validateIntent` and `getNextSequence`, instead of giving each a `throw new Error("… is not supported")`.

`combine` keeps throwing and stays declared: it is a required method, so it cannot be omitted — the device signature is attached by the signer, not here.

Two of the removed stubs were `async` functions that threw, so they returned a rejected promise; the framework default throws synchronously. Same error, raised one tick earlier — a caller using `.catch()` rather than `try`/`catch` around the call would notice.

Consumers see no change in what they can call. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `combine`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
