---
"ledger-live-desktop-e2e-tests": patch
"ledger-live-mobile-e2e-tests": patch
---

Retry a failed E2E test once on CI instead of twice. The E2E workflows' new `retries` input (0, 1 or 2) overrides it, through `E2E_RETRIES`, which also turns on retries locally.
