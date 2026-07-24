# @domain/api-currency-token

> [!CAUTION]
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Domain API client for **token currencies**, backed by the Crypto Asset List (CAL). RTK Query
endpoints and helpers, typed on the Zod-first `@domain/entity-currency-token` entity. Owns no
env/config/logging dependency.

Relocation of `libs/ledgerjs/packages/cryptoassets/src/cal-client/*` and `api-token-converter.ts`.

- `schema.ts` — Zod schema for the CAL `/v1/tokens` response (`ApiTokenResponseSchema`), reusing
  `UnitSchema` from `@domain/entity-currency-unit`.
- `types.ts` — query-arg and pagination types (`TokenByIdParams`, `TokenByAddressInCurrencyParams`,
  `GetTokensDataParams`, `TokensDataWithPagination`).
- `converter.ts` — `convertApiToken(apiToken)` → `TokenCurrency`; resolves the parent crypto
  currency from `@domain/entity-currency-crypto`'s registry and drops tokens with an unknown parent.
- `api.ts` — `cryptoAssetsApi` (`createApi`) with `findTokenById`, `findTokenByAddressInCurrency`,
  `getTokensSyncHash`, `getTokensData`. Service URLs, client version and an optional logger are read
  from the store's thunk `extraArgument`; the app supplies them via `calApiExtra(...)` so this
  package owns no env/config dependency.
- `persistence.ts` — Zod-validated RTK Query cache extraction/restoration and CAL hash validation.
- `internals/` — **package-private** (not re-exported from `index.ts`): `constants.ts` (header
  names, retry/page-size/persistence-version constants, the `TOKEN_TAGS` cache tags) and `utils.ts`
  (the derived `output` projection + response transform helpers used by `api.ts`).

Store wiring (app side):

```ts
configureStore({
  reducer: { [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: calApiExtra({
          // Pass the staging URL here when running in staging mode — the package has no staging switch.
          calServiceUrl: getEnv("CAL_SERVICE_URL"),
          ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
        }),
      },
    }).concat(cryptoAssetsApi.middleware),
});
```

When a store hosts several currency APIs (token, crypto, fiat), merge their extras with object
spread — `{ ...calApiExtra({ … }), ...cryptoApiExtra({ … }) }` yields the combined `extraArgument` type.

The imperative store builder and the slice binding (`onQueryStarted`) live in
`@features/platform-currencies`, which keeps the domain api pure (the domain layer cannot depend on a
feature package per the module boundaries).
