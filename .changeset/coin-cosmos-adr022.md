---
"@ledgerhq/coin-cosmos": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
builds, checked with `satisfies CoinModuleImpl<CosmosCoinConfig, StringMemo | MemoNotSupported>`. Six
capability methods that only threw are omitted instead of stubbed — `call`, `register`,
`craftRawTransaction`, `getRewards`, `getBlock` and `getBlockInfo`. Staking is the notable case: it is
published à la carte, so `getStakes` and `getValidators` remain real implementations and only the
reward-distribution listing goes away — the accrued amount stays available through `getStakes`.
Likewise `lastBlock` is implemented; only the per-height block lookups are absent. `getNextSequence`
is a real implementation here and is untouched.

Consumers see no behavioural change: the resolver applies the framework's `withDefaults`, which
backfills each omitted method with the same `"<name> is not supported"` throw. `supports()` on the
wrapped api now reports these capabilities as absent, which the stubs previously masked.

The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `broadcast` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
