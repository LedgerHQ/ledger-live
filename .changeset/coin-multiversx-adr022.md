---
"@ledgerhq/coin-multiversx": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns an object checked against `CoinModuleImpl` with `satisfies` — which keeps the precise shape, so a caller sees exactly which methods exist — declaring the thirteen the module implements. The six capabilities MultiversX has none of, `call`, `register`, `craftRawTransaction`, `getBlock`, `getBlockInfo` and `getRewards`, are omitted instead of each carrying a `throw new Error("… is not supported")`.

Staking is a good illustration of why capabilities are per-method rather than a group: the module keeps `getStakes` and `getValidators`, which it implements against the delegation API, and omits only `getRewards`.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now distinguishes the two halves, reporting `getStakes` and `getValidators` as real and `getRewards` as unavailable.
