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

| Endpoint | Method | Path | Purpose |
| -------- | ------ | ---- | ------- |
| `logout` | POST | `/v1/auth/logout` | End the session |
| `getUser` | GET | `/v1/user` | Read the account id and verification state |
| `orderCard` | POST | `/v1/card/order` | Order a virtual card |
| `getCardStatus` | GET | `/v1/card/status` | Read the ordered card's state and preview fields |
| `getInternalWallets` | GET | `/v1/wallet/internal` | Read every custodial wallet, with balances |
| `getCardLinkedWallets` | GET | `/v1/wallet/internal/card_linked` | Read the wallets funding the card, in charging order |

## OAuth2 grants

`exchangeAuthorizationCode` and `refreshSession` are plain thunks in `grants.ts`, not endpoints.
RTK Query and `createAsyncThunk` expose arguments and results in lifecycle actions; plain thunks
dispatch nothing, so grant credentials never enter redux. Both use `postCardJson` with the client
key and no Bearer or renewal, validate the response, and return a `PayCardSession`.

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
