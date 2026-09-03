---
"@shared/api-services": minor
"@features/flow-pay-card": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Read CARD_API_URL and CARD_BAANX_CLIENT_KEY on every use, and not one time at boot. The debug settings can now change the Card tenant without a restart. The mobile app also applies its `.env` values before the store reads them.
