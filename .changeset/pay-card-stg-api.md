---
"@domain/api-card-management": minor
"@features/flow-pay-card-auth": minor
"@domain/entity-pay-card": patch
"@devtools/pay-card": patch
"ledger-live-desktop": minor
"live-mobile": minor
---

Integrate the Card API and give its endpoints a domain owner

`@domain/api-card-management` gains the Card Auth contract: authorize initiation, authorization-code
exchange, session refresh, logout and the user read, with their zod wire schemas and inferred types.
They inject into the shared `cardApi` service, so one reducer, one middleware and one cache serve the
Card backend, and the base query supplies the base URL, `x-client-key` and the `Authorization: Bearer`
header from the `@features/platform-card` session.

`@features/flow-pay-card-auth` owns no network contract any more. It keeps the auth-only `payCardAuth`
slice and the `CardLogin` component; `useCardLoginViewModel` imports its hook from
`@domain/api-card-management`, and that import is what triggers the injection. `@domain/api-pay-card`
and its in-process mock transport are removed, along with the Pay Card mocks.

`@domain/entity-pay-card` continues to own the shared Pay Card Redux state that both apps register.

Only the login step ships here. The callback code exchange and the card status read stay behind until
the session has an owner that can store and refresh it.
