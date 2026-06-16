# @domain/api-currencies

Domain API for currencies. RTK Query endpoints and helpers, typed with the
Zod-first entities from `@domain/entity-*`.

## `cvs/` — Countervalues Service

RTK Query evolution of `libs/ledger-live-common/src/currencies/support.ts`.

- `schema.ts` — Zod schema for the `/v3/supported/fiat` response (array of tickers).
- `api.ts` — `cvsApi` (`createApi`) with the `getSupportedFiats` query.
- `internals.ts` — OFAC currencies set and filtering (private).
- `utils.ts` — `resolveSupportedFiats(tickers)` → `FiatCurrency[]` (public).

The slice holding the resolved supported fiats lives in `@features/platform-currencies`
and is populated via `cvsApi.endpoints.getSupportedFiats.matchFulfilled`.
