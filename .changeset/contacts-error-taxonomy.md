---
"ledger-live-desktop": patch
"live-mobile": patch
"@features/platform-contacts": patch
---

Map Contacts device intent failures onto a dedicated JobState per outcome (app version too low, invalid input, device rejected, existing-group verification failed, unsupported operation, device error) instead of one generic `failed`, so the UI can switch on `jobState.type` directly.
