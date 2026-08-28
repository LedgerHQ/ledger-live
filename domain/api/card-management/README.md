# @domain/api-card-management

> [!CAUTION] > **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Domain API client for **Card Management**. Injects its RTK Query endpoints and cache tags into the
shared `cardApi` service (`@shared/api-services`, `services/card`) rather than declaring its own
`createApi`, so one reducer, one middleware and one cache serve every Card use case.

- `api.ts` — `cardManagementApi`: `cardApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...)`.
- `grants.ts` — the two OAuth2 grants, as plain thunks. Not endpoints. See below.
- `schema.ts` — zod wire contracts for the responses below.
- `types.ts` — the inferred response types and the request arguments each endpoint takes.
- `transforms.ts` — maps a validated wire response onto its canonical shape.
- `constants.ts` — `CARD_MANAGEMENT_TAGS` and the OAuth2 token path.

Every endpoint is declarative: `query`, never `queryFn`, with the schemas and the transform doing the
rest. [`.agents/skills/card-endpoint-shape`](.agents/skills/card-endpoint-shape/SKILL.md) has the
shape and the reasons.

| Endpoint               | Method | Path                              | Purpose                                              |
| ---------------------- | ------ | --------------------------------- | ---------------------------------------------------- |
| `logout`               | POST   | `/v1/auth/logout`                 | End the session                                      |
| `getUser`              | GET    | `/v1/user`                        | Read the account id and verification state           |
| `orderCard`            | POST   | `/v1/card/order`                  | Order a virtual card                                 |
| `getCardStatus`        | GET    | `/v1/card/status`                 | Read the ordered card's state and preview fields     |
| `getInternalWallets`   | GET    | `/v1/wallet/internal`             | Read every custodial wallet, with balances           |
| `getCardLinkedWallets` | GET    | `/v1/wallet/internal/card_linked` | Read the wallets funding the card, in charging order |

## The two OAuth2 grants are not endpoints

`exchangeAuthorizationCode` and `refreshSession` are **plain thunks** in `grants.ts`. Both post to
`/v1/auth/oauth2/token`, separated by `grant_type`, and both answer with a `PayCardSession`.

RTK Query dispatches an action for every phase of a request: the argument rides on the pending one
and the answer on the fulfilled one. A `createAsyncThunk` does the same. Each grant presents a
credential and answers with two more, and the desktop redux logger writes every action into the file
users attach to a support ticket, in production, while the mobile DevTools relay sends every action
over a socket and takes no sanitizer.

A plain thunk dispatches nothing. Dispatching one runs it and answers with the session, so the
credentials go straight to the caller.

They send their request with `postCardJson` from `@shared/api-services` — the same base URL and
`x-client-key`, no Bearer, and no renewal. A grant carries its own proof, and a renewal that went
through the authenticated path would answer 401, renew again, and loop. A failure throws a
`CardRequestError` that names the path and the status, never the body.

Neither grant has a hook. A renewal is the base query's decision, and the code exchange belongs to
the login machine.

`cardManagementApi` **is** `cardApi` after injection: importing this package is a module-level side
effect that adds its endpoints to the shared service. The app registers `cardApi` (not this package)
in the store; a view-model importing a generated hook from here triggers the injection.

Reaching the backend belongs to the service, not here: base URL, `x-client-key`, the
`Authorization: Bearer` header from `readCardSession()` and the single 401 renewal all live in
`@shared/api-services`, `services/card`. The OAuth client id and redirect URI are the app's, so they
reach the endpoints as request arguments. Every endpoint answers with its wire contract and nothing
more.

> [!NOTE]
> The `PayCard*Response` schemas and types here are the **wire** contracts; canonical results may add
> app-resolved service configuration. `@domain/entity-pay-card` exports some of the same names for the
> app-facing model, with different shapes. The two are reconciled under LIVE-34769, which gives the
> session an owner.
