---
"@shared/auth": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

`@shared/auth` drops the `authEnvironment` slice: Keycloak reads its base URL from the app config, so nothing reads it any more.
