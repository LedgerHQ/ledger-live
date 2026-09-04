---
"@ledgerhq/live-common": minor
---

Repoint `sortCurrenciesByDada` from DADA to the Counter Value Service.

The internal `fetchMarketcapIds` helper now fetches from the CVS
`/v3/supported/crypto` endpoint (the same source already used by
`useCurrenciesByMarketcap` via the RTK Query client). The DADA
`/assets` call is removed entirely from `live-common`.

**Behaviour change**: previously a network failure fell back to the
original (unsorted) currency order. It now rejects, which propagates
out of `listApps`' `Promise.all` as a visible failure — matching the
original intent of the function.

`sortCurrenciesByIds` is unchanged. `sortCurrenciesByDada` retains its
name and signature; callers require no changes.

Note: `grep -rn "v3/supported/crypto"` now returns two places —
the RTK Query client (`counterValues/state-manager/api.ts`) and this
helper. Consolidating to a single CVS client is a Phase 1 outcome, not
a Phase -1 gate.
