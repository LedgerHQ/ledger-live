---
"@shared/env": patch
"@shared/api-services": patch
"live-mobile": patch
"ledger-live-desktop": patch
---

Rename the `CARD_API_URL` env var to `CARD_BAANX_API_URL`. Production remains the default: `https://card.api.live.ledger.com` and an empty `CARD_BAANX_CLIENT_KEY`.
