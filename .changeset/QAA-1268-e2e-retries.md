---
"ledger-live-desktop-e2e-tests": patch
"ledger-live-mobile-e2e-tests": patch
---

Retry a failed E2E test once on CI instead of twice. Desktop records video only on the last retry of a test that already failed, so a run without retries records none.
