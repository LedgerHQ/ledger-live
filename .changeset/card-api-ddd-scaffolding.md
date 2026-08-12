---
"@shared/api-services": minor
"@domain/api-card-management": minor
"@features/platform-card": minor
"@shared/env": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` env, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).
