---
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
"live-mobile": patch
---

Fix desktop asset detail all-time price variation to derive from chart endpoints instead of the 1y market change, and correct the 6m range mapping. Extract shared market chart and variation helpers to live-common for desktop and mobile.
