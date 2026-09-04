---
"@ledgerhq/live-common": minor
---

Repoint `fetchMarketcapIds` in `sortByMarketcap.ts` from the
`live-countervalues` package API to a direct call to the Counter Value
Service (`/v3/supported/crypto`).

The function signature, fallback behaviour (`() => currencies` on
network error), and all callers are unchanged.

The `MOCK_COUNTERVALUES` dispatch is preserved: when the env is set,
`fetchMarketcapIds` returns ids from `TICKER_TO_ID_AND_VALUE` (the same
fixture source the old `api.mock.ts` used) without making a network
call. This keeps mocked desktop and mobile e2e runs on fixtures rather
than hitting the live network.

`fetchIdsSortedByMarketcap` in `live-countervalues` now has zero
callers outside its own package.
