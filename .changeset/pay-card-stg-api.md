---
"@features/flow-pay-card-auth": minor
"@domain/entity-pay-card": minor
"@shared/api-services": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Integrate the staging Card API pre-auth flow and remove the Pay Card mocks

`@shared/api-services` gains `services/pay-card`, the endpoint-less api owning the Card API base URL
(`PAY_CARD_API_BASE_URL`, VPN-only staging). The `pre-auth` endpoint now lives with the flow that
calls it, in `@features/flow-pay-card-auth`, injected into that service along with its wire
contracts; `@domain/api-pay-card` and its in-process mock transport are removed.

Only `pre-auth` ships in this change. The OAuth code exchange and card status read are deferred until
the callback and status steps can also provide session-token handling. `@domain/entity-pay-card`
owns the shared Pay Card Redux state registered by both apps, while Card API schemas and the
auth-only `payCardAuth` slice remain local to `@features/flow-pay-card-auth`.
