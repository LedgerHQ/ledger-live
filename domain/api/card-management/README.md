# @domain/api-card-management

> [!CAUTION] > **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Domain API client for **Card Management**. Injects its RTK Query endpoints and cache tags into the
shared `cardApi` service (`@shared/api-services`, `services/card`) rather than declaring its own
`createApi`, so one reducer, one middleware and one cache serve every Card use case.

- `api.ts` — `cardManagementApi`: `cardApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...)`.
- `schema.ts` — zod wire contracts for the responses below.
- `types.ts` — the inferred response types and the request arguments each endpoint takes.
- `transforms.ts` — maps a validated wire response onto its canonical shape.
- `constants.ts` — `CARD_MANAGEMENT_TAGS` and the OAuth2 token path.

Every endpoint is declarative: `query`, never `queryFn`, with the schemas and the transform doing the
rest. [`.agents/skills/card-endpoint-shape`](.agents/skills/card-endpoint-shape/SKILL.md) has the
shape and the reasons.

| Endpoint | Method | Path | Purpose |
| -------- | ------ | ---- | ------- |
| `exchangeAuthorizationCode` | POST | `/v1/auth/oauth2/token` | Turn the redirect's code into a session |
| `refreshSession` | POST | `/v1/auth/oauth2/token` | Rotate both tokens after a 401 |
| `logout` | POST | `/v1/auth/logout` | End the session |
| `getUser` | GET | `/v1/user` | Read the account id and verification state |
| `orderCard` | POST | `/v1/card/order` | Order a virtual card |
| `getCardStatus` | GET | `/v1/card/status` | Read the ordered card's state and preview fields |
| `getInternalWallets` | GET | `/v1/wallet/internal` | Read every custodial wallet, with balances |
| `getCardLinkedWallets` | GET | `/v1/wallet/internal/card_linked` | Read the wallets funding the card, in charging order |

## OAuth2 grants

`exchangeAuthorizationCode` and `refreshSession` are the two token grants. Both post to
`/v1/auth/oauth2/token`, and `grant_type` separates them. They declare
`extraOptions: { authenticated: false }`, so the base query sends no Bearer and never renews: a
grant presents its own credential, and a grant that renewed would answer its own 401 with another
grant and loop.

Both carry credentials in both directions, so three rules hold them:

1. **No hook.** A renewal is the base query's decision, and the code exchange belongs to the login
   machine. `api.ts` exports a hook for every other endpoint and none for these two.
2. **`track: false` at every call site.** The session never becomes a cache entry, so it never
   reaches redux state, a DevTools state dump or a state export.
3. **Redaction before any reader.** RTK Query still dispatches a pending and a settled action for
   each grant, and both carry the credential. The apps pass every Card action through
   `redactCardApiAction` from `@shared/api-services` before the desktop logger, the desktop DevTools
   or the mobile DevTools relay reads one. `redactCardApiState` does the same for the state.

`CARD_GRANT_ENDPOINTS` in `@shared/api-services` names both grants for the state redaction. A test
in `api.test.ts` holds that list and these endpoints together.

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
