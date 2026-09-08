---
"@ledgerhq/live-common": minor
"@domain/entity-currency-crypto": minor
---

Stop calling the decommissioned Fantom explorer. Fantom Opera migrated to Sonic and its explorer infrastructure is gone: ftmscout.com returns HTTP 522 and ftmscan.com no longer resolves, which made adding a Fantom account fail with "Invalid Response from Fantom explorer".

Fantom now uses `explorer: { type: "none" }`, so accounts sync balances through the still-live RPC node instead of erroring, with an empty operation history. The user-facing explorer links point to the OKX explorer.
