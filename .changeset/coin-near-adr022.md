---
"@ledgerhq/coin-near": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<NearConfig>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the six capabilities NEAR has none of, `getBlock`, `getRewards`, `getNextSequence`, `craftRawTransaction`, `call` and `register`, instead of giving each a `throw new Error("… is not supported")`.

Why each is absent is recorded above the factory rather than lost with the stub it used to sit on. Two of them are genuine chain facts worth keeping: NEAR's nonce belongs to an access key rather than to an account, so there is no account-level sequence to return, and a staking pool compounds rewards into the staked balance instead of emitting distribution events, so `getStakes` already reports what `getRewards` would have listed. The staking reads NEAR does implement — `getStakes` and `getValidators`, backed by real pool-contract delegation — are untouched.

The parameters an implementation declares now matter: `satisfies` infers the signature from the function itself, so the trailing `options` argument of `craftTransaction`, `estimateFees` and `validateIntent` carries an explicit `?` rather than relying on the contract to make it optional.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
