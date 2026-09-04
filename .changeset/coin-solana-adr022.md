---
"@ledgerhq/coin-solana": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<…>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the five capabilities the chain has none of, `call`, `register`, `getBlock`, `getBlockInfo` and `getRewards`, instead of giving each a `throw new Error("… is not supported")`.

Staking stays: `getStakes` and `getValidators` are implemented against the chain's stake accounts and validator list, and only `getRewards` is absent.

Consumers see no change in what they can call. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `getValidators` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.
