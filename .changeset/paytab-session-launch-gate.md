---
"@ledgerhq/baanx-test-client": minor
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
---

Inject CARD_SESSION_BOOTSTRAP only on opted-in E2E launches: desktop via `injectCardSession`, mobile on the first boot when the spec path contains `/paytab/`, using a set env value when present and otherwise minting through the Baanx test client cache.
