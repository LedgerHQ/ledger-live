---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

feat(account-data): share one full sync between BridgeSync and the FullSync source

`syncLegacyAccount` writes each update into the legacy store and shares the sync in flight per account, so the background sync and account data reads never sync one account twice. The FullSync source skips the sync of an account whose last sync completed within the default max age, and answers it from the store.
