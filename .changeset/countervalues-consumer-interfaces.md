---
"@ledgerhq/asset-aggregation": minor
"@ledgerhq/wallet-analytics": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Let asset-aggregation and wallet-analytics declare the countervalues interface they need

Both packages only ever needed one countervalues operation, `calculate`, over a state they
receive as a parameter and never inspect. They now declare that operation themselves as a
`RateLookup` interface, treat the state as an opaque `RateSnapshot`, and drop
`@ledgerhq/live-countervalues` from their dependencies entirely. The apps fill the interface
at startup, beside the crypto-assets store and the currencies resolver.

No caller changes: the exported signatures keep their arity and the state argument is
assignable as before, so the 41 files consuming these two packages are untouched.

Tests get simpler as a side effect. Mocking countervalues was a module mock reaching across a
package boundary; it is now an injected fake passed to `setRateLookup`.
