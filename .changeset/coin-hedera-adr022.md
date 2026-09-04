---
"@ledgerhq/coin-hedera": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<HederaCoinConfig, HederaMemo, HederaTxData>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the five capabilities the module has none of, `validateIntent`, `getNextSequence`, `craftRawTransaction`, `call` and `register`, instead of giving each a `throw new Error("… is not supported")`.

Why each is absent is recorded above the factory rather than lost with the stub it used to sit on. Two are worth spelling out: intent validation still lives in the account bridge's `getTransactionStatus`, so the api path has none of its own yet, and there is no sequence to hand out because a Hedera transaction is identified by its payer plus a valid-start timestamp rather than by a per-account nonce. Staking, by contrast, is fully covered and untouched — Hedera proxy-stakes to a node id, so `getStakes`, `getRewards` and `getValidators` are all real implementations. So are the two methods that throw for a reason rather than as a placeholder: `craftTransaction` rejects `useAllAmount` and `listOperations` rejects a non-zero `minHeight`, both argument validations on working code.

The return type also loses its `& BridgeApi` half. Every member of `BridgeApi` is optional and this factory supplied none of them, so the intersection only ever promised hooks that were not there; nothing consumes `createApi` yet, so no call site relied on it.

The parameters an implementation declares now matter: `satisfies` infers the signature from the function itself, so the trailing `options` argument of `combine`, `craftTransaction`, `getValidators` and `getRewards` carries an explicit `?` rather than relying on the contract to make it optional — the integration suite already calls `getValidators(context)` and `getRewards(context, address)` without it.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `estimateFees`, `getStakes` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
