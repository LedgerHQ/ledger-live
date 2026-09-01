---
"@ledgerhq/coin-evm": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<EvmConfigInfo, MemoNotSupported, BufferTxData>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits `craftRawTransaction`, `register`, `getStakes` and `getRewards` instead of giving each a `throw new Error("… is not supported")`.

Staking is partial rather than absent, which is why the capabilities are per-method: `getValidators` stays and serves the validator list, while no staking position or reward event is read here.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.
