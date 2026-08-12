# @domain/api-card-management

> [!CAUTION] > **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Domain API client for **Card Management**. Injects its RTK Query endpoints and cache tags into the
shared `cardApi` service (`@shared/api-services`, `services/card`) rather than declaring its own
`createApi`, so one reducer, one middleware and one cache serve every Card use case.

- `api.ts` — `cardManagementApi`: `cardApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...)`.
  Currently a scaffold with no endpoints; they land with the first Card Management contract.
- `constants.ts` — `CARD_MANAGEMENT_TAGS`, the cache tags this use case owns.

`cardManagementApi` **is** `cardApi` after injection: importing this package is a module-level side
effect that adds its endpoints to the shared service. The app registers `cardApi` (not this package)
in the store; a view-model importing a generated hook from here triggers the injection.

Card Auth stays in the `@domain/api-pay-card` holdout for now; its endpoints migrate onto this same
`cardApi` service under LIVE-33829.
