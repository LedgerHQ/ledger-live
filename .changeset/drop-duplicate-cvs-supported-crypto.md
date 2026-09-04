---
"@ledgerhq/live-countervalues": minor
---

Remove `fetchIdsSortedByMarketcap` from the legacy countervalues API client. The RTK Query client in `ledger-live-common` already covers the same endpoint and is the single source of truth going forward.
