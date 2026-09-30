---
"@ledgerhq/live-countervalues-react": minor
---

Remove `@ledgerhq/live-countervalues` from the monorepo. Every consumer now imports `@domain/entity-market-countervalues` directly, which holds the only copy of the countervalues logic. The README of `@ledgerhq/live-countervalues-react` now names the entity package as the state it wraps.
