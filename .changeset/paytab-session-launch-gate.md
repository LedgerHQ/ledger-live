---
"@ledgerhq/baanx-test-client": minor
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
---

Inject CARD_SESSION_BOOTSTRAP only when the spec path contains `/paytab/`, on desktop and mobile, using a set env value when present and otherwise minting through the Baanx test client cache.
