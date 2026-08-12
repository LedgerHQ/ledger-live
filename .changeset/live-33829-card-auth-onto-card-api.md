---
"@domain/api-card-management": minor
"@features/flow-pay-card-auth": minor
"@shared/api-services": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Move the Card Auth endpoints onto the shared `cardApi` service

The five Card Auth endpoints — authorize initiation, code exchange, session refresh, logout and the
user read — move out of `@features/flow-pay-card-auth` and into `@domain/api-card-management`, with
their zod wire schemas and inferred types. A `features/flow/*` package no longer owns any network
contract; `useCardLoginViewModel` imports its hook from the use-case package, which is what triggers
injection.

They now inject into `cardApi` instead of `payCardApi`, so one reducer, one middleware and one cache
serve the Card backend. `cardApi`'s base query supplies the `Authorization: Bearer` header from the
`@features/platform-card` session, which replaces the empty placeholder header `logout` and `getUser`
carried. `services/pay-card` and `payCardApi` are removed from `@shared/api-services` and
deregistered in both apps.
