---
"@ledgerhq/coin-hedera": minor
---

Fetch the HBAR/USD spot rate directly from the countervalues service instead of through `@ledgerhq/live-countervalues`, removing that runtime dependency. Rate values, caching, and the fallback to the default fee estimate are unchanged.
