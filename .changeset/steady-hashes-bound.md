---
"@domain/api-currency-token": minor
"live-mobile": patch
"ledger-live-desktop": patch
---

Bound the sync-hash fetch with a 30s timeout and restore persisted tokens at launch without waiting for the CAL sync-hash check. Keep the persisted hash paired with restored tokens until their hash check completes.
