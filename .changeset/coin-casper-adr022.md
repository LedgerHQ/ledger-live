---
"@ledgerhq/coin-casper": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<CasperConfig, CasperMemo>`
— which keeps the precise shape, so a caller sees exactly which methods exist — and omits the
eight capabilities Casper does not expose: block queries (`getBlock`, `getBlockInfo`), `call`,
`register`, staking (`getValidators`, `getStakes`, `getRewards`) and `craftRawTransaction`.

`craftTransactionData` is the interesting one and is *not* omitted. It is the single
unsupported method the contract requires, so the type will not let it be dropped; it stays
declared, now built with the framework's `notSupported()` helper rather than an inline throw.
That keeps the distinction the migration is about visible in the source: eight absent
capabilities on one side, one required method this module does not implement on the other.

`getNextSequence` keeps its real implementation returning `0n` — Casper uses transaction hash
plus TTL for replay protection rather than a per-account nonce, so zero is an answer, not a
placeholder.

Callers see no change: the resolver's `withDefaults` supplies every omitted capability, so the
same call raises the same error from one place. What improves is introspection — `supports()`
can now tell these capabilities are absent, which was impossible while a throwing placeholder
occupied the slot and looked exactly like an implementation.

The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `broadcast` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.
