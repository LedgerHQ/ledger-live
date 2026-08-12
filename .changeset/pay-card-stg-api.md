---
"@features/flow-pay-card-auth": minor
"@domain/entity-pay-card": minor
"@shared/api-services": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Integrate the staging Card API pre-auth flow and remove the Pay Card mocks

The Card API endpoints move onto the endpoint-less service pattern in `@shared/api-services`, reading
the Card API base URL from `CARD_API_URL` (the staging host is VPN-only). `@domain/api-pay-card` and
its in-process mock transport are removed.

`@domain/entity-pay-card` owns the shared Pay Card Redux state registered by both apps, while the
auth-only `payCardAuth` slice stays local to `@features/flow-pay-card-auth`. The endpoints and their
wire contracts land in `@domain/api-card-management` — see the LIVE-33829 entry.
