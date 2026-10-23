---
"@ledgerhq/live-common": minor
---

`useAPI` shares one in-flight request between hooks asking for the same data, so concurrent callers no longer fetch it twice. `useFetchCurrencyAll` exposes `isResolved`, which tells a catalog still loading apart from a resolved empty one.
