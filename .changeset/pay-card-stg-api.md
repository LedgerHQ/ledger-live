---
"@features/flow-pay-card-auth": minor
"@domain/entity-pay-card": minor
"@shared/api-services": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Integrate the staging Card API and drop the Pay Card mocks

`@shared/api-services` gains `services/pay-card`, the endpoint-less api owning the Card API base URL
(`PAY_CARD_API_BASE_URL`, VPN-only staging) and the app session bearer. The pre-auth, auth and me
endpoints now live with the flow that calls them, in `@features/flow-pay-card-auth`, injected into
that service; `@domain/api-pay-card` and its in-process mock transport are removed. `/me` follows the
staging contract, replacing `providerUserId` and `phase` with the card status fields.
