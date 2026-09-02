---
"@shared/env": patch
"@shared/api-services": patch
"@devtools/bindings": patch
"@devtools/pay-card": patch
"live-mobile": patch
"ledger-live-desktop": patch
---

Rename the `CARD_API_URL` env var to `CARD_BAANX_API_URL`, and point the two Card env vars at the staging tenant. `CARD_BAANX_API_URL` now defaults to `https://dev.api.baanx.com`, and `CARD_BAANX_CLIENT_KEY` defaults to the Baanx staging client key. A tester gets the staging tenant with no manual override.
