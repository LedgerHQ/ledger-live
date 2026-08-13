# @domain/api-card-management

> [!CAUTION] > **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Domain API client for **Card Management**. Injects its RTK Query endpoints and cache tags into the
shared `cardApi` service (`@shared/api-services`, `services/card`) rather than declaring its own
`createApi`, so one reducer, one middleware and one cache serve every Card use case.

- `api.ts` — `cardManagementApi`: `cardApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...)`.
- `schema.ts` — zod wire contracts for the responses below.
- `types.ts` — the inferred response types and the request arguments each endpoint takes.
- `transforms.ts` — maps a wire response onto its canonical shape, for `transformResponse`.
- `constants.ts` — `CARD_MANAGEMENT_TAGS`, the cache tags this use case owns.

| Endpoint | Method | Path | Purpose |
| -------- | ------ | ---- | ------- |
| `initiateAuthorize` | GET | `/v1/auth/oauth/authorize/initiate` | Start a login and get the hosted login URL |
| `exchangeAuthorizationCode` | POST | `/v1/auth/oauth/token` | Exchange the authorization code for a session |
| `refreshSession` | POST | `/v1/auth/oauth/token` | Same endpoint, `refresh_token` grant |
| `logout` | POST | `/v1/auth/logout` | End the session |
| `getUser` | GET | `/v1/user` | Read the account id and verification state |

`cardManagementApi` **is** `cardApi` after injection: importing this package is a module-level side
effect that adds its endpoints to the shared service. The app registers `cardApi` (not this package)
in the store; a view-model importing a generated hook from here triggers the injection.

Reaching the backend belongs to the service, not here: base URL, `x-client-key`, the
`Authorization: Bearer` header from `getCardSessionToken()` and the single 401 refresh all live in
`@shared/api-services`, `services/card`.

> [!NOTE]
> The `PayCard*` schemas and types here are the **wire** contracts. `@domain/entity-pay-card` exports
> some of the same names for the app-facing model, with different shapes. The two are reconciled
> under LIVE-34769, which gives the session an owner.
