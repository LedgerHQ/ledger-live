---
"@shared/auth": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

`@shared/auth` drops the `authEnvironment` slice: Keycloak reads its base URL from the app config, so nothing reads it any more.
