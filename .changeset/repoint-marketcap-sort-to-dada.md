---
"@ledgerhq/live-common": minor
---

Repoint `fetchMarketcapIds` in `sortByMarketcap.ts` from the
`live-countervalues` package API to a direct call to the Counter Value
Service (`/v3/supported/crypto`).

The function signature, fallback behaviour, and all callers are
unchanged. `fetchIdsSortedByMarketcap` in `live-countervalues` now has
zero callers outside its own package.
