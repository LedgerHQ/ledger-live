---
"@ledgerhq/coin-sui": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<…>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the five capabilities the chain has none of, `call`, `register`, `craftRawTransaction`, `validateIntent` and `getNextSequence`, instead of giving each a `throw new Error("… is not supported")`.

The parameters an implementation declares now matter: `satisfies` infers the signature from the function itself, so the optional trailing arguments of `getStakes`, `getRewards` and `getValidators` carry an explicit `?` rather than relying on the contract to make them optional.

Consumers see no change in what they can call. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `combine`, `craftTransaction`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.
