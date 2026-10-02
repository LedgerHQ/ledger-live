---
"@domain/api-account-data-source": minor
"@ledgerhq/live-common": minor
"@devtools/bindings": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Read account data for many accounts at once: the router merges reads issued in the same tick, gives each source one call per batch or a bounded run of single reads, and `fetchAccountDataBatch` reads a list explicitly
