---
"@domain/entity-market-countervalues": minor
"@ledgerhq/wallet-pnl": minor
"@ledgerhq/web-tools": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Let wallet-pnl declare the countervalues interface it needs

The package computed profit and loss straight against the countervalues implementation, which
tied a pure pricing calculation to a concrete state shape. It now declares the three operations
it uses as a `RateLookup` interface, treats the state as an opaque snapshot, and drops
`@ledgerhq/live-countervalues` from its dependencies. The apps fill the interface at startup,
beside the crypto-assets store and the two lookups already registered there.

The exported signatures keep their arity and the state argument is assignable as before, so no
caller needs a change for the interface.

The third operation is a cache key. `getCostBasis` memoises against a fingerprint of the rate
history relevant to a pair, which it used to compute inline from three countervalues helpers.
That computation moves to `@domain/entity-market-countervalues` as `historyKey`, beside the
`lenseRateMap` it is built on, so the three apps share one copy instead of each carrying its own
and risking drift. A drifted key serves a stale cost basis silently. The key string is unchanged,
and the existing cache tests pin it without being modified.

The synthetic state builder moves with it. `buildCV`, `buildMultiCV` and `dailyHistory`
construct countervalues state rather than reading it, so they cannot work against an opaque
snapshot; they now live behind `@domain/entity-market-countervalues/mock`, and
`@ledgerhq/wallet-pnl/scenarios` no longer exports them. The web-tools pnl-calculator imports them
from the entity directly.

web-tools registers the interface too. It renders profit and loss through the same package but
was never a consumer of the two lookups registered previously, so it needed wiring of its own.
