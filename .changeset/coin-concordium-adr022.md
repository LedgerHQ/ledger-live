---
"@ledgerhq/coin-concordium": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
builds, checked with `satisfies CoinModuleImpl<ConcordiumCoinConfig, ConcordiumMemo>`. Seven
capability methods that only threw are omitted instead of stubbed — `call`, `register`, the three
staking reads (`getStakes`, `getRewards`, `getValidators`), `validateIntent`, and `getNextSequence`
(the crafting path resolves the sequence internally via `getNextValidSequence`, so the capability was
never published to callers anyway). Everything Concordium does implement stays, including
`craftRawTransaction` and the full block API (`lastBlock`, `getBlockInfo`, `getBlock`), which are real
implementations rather than stubs.

Consumers see no behavioural change: the resolver applies the framework's `withDefaults`, which
backfills each omitted method with the same `"<name> is not supported"` throw. `supports()` on the
wrapped api now reports these capabilities as absent, which the stubs previously masked.

The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `combine`, `craftTransaction`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
