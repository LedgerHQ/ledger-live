---
"@domain/entity-market-countervalues": minor
"@features/platform-market-countervalues": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Stop re-rendering every amount on a countervalues load that changes no rate

A load now keeps a pair's rate Map and cache entry when every fetched value equals the stored one, and
keeps the whole cache object when no pair changed. The conversions read the cache alone, through
`useCountervaluesCache`, so a load that only stamps the fetch status no longer re-renders them. The
conversions and the persisted export are the same as before.
