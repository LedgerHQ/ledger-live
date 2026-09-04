---
"@ledgerhq/coin-vechain": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
builds, checked with `satisfies CoinModuleImpl<VechainCurrencyConfig>`. The seven capability methods
that only threw are omitted instead of stubbed — `call`, `register`, `craftRawTransaction`, the three
staking reads (`getStakes`, `getRewards`, `getValidators`), and `getNextSequence`, which has no
meaning for VeChain: `craftTransaction` gets its replay protection from the transaction's `blockRef`
and a generated `nonce`, not from a per-account sequence. The VET + VTHO surface the module really
serves is unchanged (balances, operations, the block API, crafting, fee estimation, combine,
broadcast, intent and address validation).

Consumers see no behavioural change: the resolver applies the framework's `withDefaults`, which
backfills each omitted method with the same `"<name> is not supported"` throw. Two details shift for
anyone asserting on the module directly — `getNextSequence` now reports "not supported" instead of
"not applicable for Vechain", and `register` throws synchronously (the framework default) where the
removed stub returned a rejected promise.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
