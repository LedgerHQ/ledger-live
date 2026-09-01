---
"@ledgerhq/coin-tron": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<TronCoinConfig, TronMemo, TronTxData>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the four capabilities Tron has none of instead of giving each a `throw new Error("… is not supported")`.

Why each is absent is recorded above the factory rather than lost with the stub it used to sit on: contract reads (`triggerconstantcontract`) are not supported yet, withdrawals already appear in `listOperations`, the chain accepts no externally-built transaction, and there is no enrollment step.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `combine`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.
