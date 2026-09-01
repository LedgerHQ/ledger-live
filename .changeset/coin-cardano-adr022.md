---
"@ledgerhq/coin-cardano": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
builds, checked with `satisfies CoinModuleImpl<CardanoCoinConfig, StringMemo>`. The seven capability
methods the module never implemented are omitted instead of stubbed — `call`, `register`,
`craftRawTransaction`, `getBlock`, `getBlockInfo`, `getRewards` and `getNextSequence`, the last one
because Cardano is UTXO-based and has no per-account sequence to advance. Cardano's partial staking
support is unchanged and now visible in the type: `getStakes` and `getValidators` are real
implementations, only the reward-distribution listing is absent.

Consumers see no behavioural change. The generic-coin-framework resolver hands the module out through
the framework's `withDefaults`, which backfills every omitted method with the same
`"<name> is not supported"` throw the stubs raised — the one wording change is `getNextSequence`,
which now reports "not supported" rather than "not applicable for Cardano". `supports()` on the
wrapped api now reports these capabilities as absent, which the stubs previously masked.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
