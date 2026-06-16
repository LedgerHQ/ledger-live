---
"live-mobile": minor
"ledger-live-desktop": patch
"@ledgerhq/live-common": minor
---

feat(lwm): add the success confirmation screen to the new send flow

- Add the full-screen "Transaction signed" success step shown after broadcast on mobile.
- Extract the confirmation status logic into live-common (`flows/send/confirmation`) so desktop and mobile share a single source of truth.
