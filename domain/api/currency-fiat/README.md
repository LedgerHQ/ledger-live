# @domain/api-currency-fiat

> [!CAUTION]
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Domain API client for **fiat currencies**, backed by the Ledger Countervalues Service (CVS). RTK
Query endpoint and helpers, typed on the Zod-first `@domain/entity-currency-fiat` entity. Owns no
env/config/logging dependency.

Start of the DDD evolution of `libs/ledger-live-common/src/currencies/support.ts` (the supported-fiat
part) into an RTK Query model, following the `@domain/api-currency-token` package strategy.

- `schema.ts` — Zod schemas for the CVS `/v3/supported/fiat` response (`SupportedFiatsResponseSchema`,
  an array of tickers) and the `extraArgument` contract (`CvsApiExtraSchema`).
- `types.ts` — inferred `SupportedFiatsResponse` and `CvsApiExtra` types.
- `converter.ts` — `resolveSupportedFiats(tickers) → FiatCurrency[]`: normalizes tickers, drops
  OFAC-sanctioned currencies, resolves entities from `@domain/entity-currency-fiat` (dropping unknown
  tickers) and de-duplicates by id.
- `api.ts` — `currencyFiatApi` (`createApi`) with the `getSupportedFiats` query, whose
  `transformResponse` validates and resolves the response to `FiatCurrency[]`. The CVS URL is read
  from the store's thunk `extraArgument`; the app supplies it via `cvsApiExtra(...)` so this package
  owns no env/config dependency.
- `internals/` — **package-private** (not re-exported from `index.ts`): `constants.ts` (cache tags,
  reducer path, retry count, the OFAC ticker `Set`).

Store wiring (app side):

```ts
configureStore({
  reducer: { [currencyFiatApi.reducerPath]: currencyFiatApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: cvsApiExtra({
          // Pass the staging URL here when running in staging mode — the package has no staging switch.
          countervaluesServiceUrl: getEnv("LEDGER_COUNTERVALUES_API"),
        }),
      },
    }).concat(currencyFiatApi.middleware),
});
```

When a store hosts several currency APIs (token, crypto, fiat), merge their extras with object
spread — `{ ...calApiExtra({ … }), ...cvsApiExtra({ … }) }` yields the combined `extraArgument` type.

#### Intentional, scoped divergences vs legacy `support.ts`

This is the _start_ of the migration and is **not connected into the apps yet** — so the following
are deliberately deferred:

- **No local fallback list** when the CVS call fails or returns `[]` (legacy fell back to a 36-ticker
  hardcoded list). On failure the query has no `data` (RTK Query error state, `data === undefined`);
  consumers should default with `?? []`. There is no empty-array seeding for now.
- **Registry-bounded resolution**: tickers the `@domain/entity-currency-fiat` registry doesn't know
  yet are dropped. The registry is being onboarded incrementally.
- **OFAC list is duplicated** (not shared with `support.ts`) on purpose — the domain package must not
  depend on `@ledgerhq/live-common`. A single source of truth can be revisited once `support.ts` is
  retired.

## App integration & reconciling legacy usecases (planned, not built yet)

This package is intentionally a **pure CVS client**: it fetches, validates and resolves to
`FiatCurrency[]`. It owns no redux slice, no fallback, no retry/orchestration policy — those are
**app/UX concerns** and the domain layer cannot depend on a feature package (module boundaries). So
the missing pieces from legacy `support.ts` are not lost; they move up a layer.

The home for that layer is a future **`@features/platform-currencies`** package (already referenced by
`@domain/api-currency-token`'s README; the `features/platform/currencies` dir is a stale stub for
now). It is expected to own:

- **The `supportedFiats` slice** — populated via `extraReducers` on
  `currencyFiatApi.endpoints.getSupportedFiats.matchFulfilled`, storing the resolved `FiatCurrency[]`.
- **The fallback list** — the legacy 36-ticker hardcoded list. Because this API surfaces an RTK Query
  **error/empty** state rather than degrading (see divergences above), the feature selector is where
  the legacy "never-empty" contract of `listSupportedFiats()` is re-established: on error or `[]`, the
  selector returns the local fallback (resolved through `@domain/entity-currency-fiat`, OFAC-filtered
  the same way). Keep the fallback here, not in the api — it is a product decision, not a CVS fact.
- **Orchestration** — the retry currently in mobile `LedgerStore.tsx` (`retry(listSupportedFiats, …)`)
  and the eager fetch in desktop `settings.ts` become a `getSupportedFiats` `initiate(...)` (or hook)
  plus the slice binding.

**Call sites to migrate** (the usecases to reconcile), all currently consuming
`listSupportedFiats()` from `@ledgerhq/live-common`:

- `apps/ledger-live-mobile/src/context/LedgerStore.tsx` — `updateSupportedCountervalues()`
- `apps/ledger-live-desktop/src/renderer/reducers/settings.ts` — `getsupportedCountervalues()`

The migration is a swap of the data source (CVS client + feature selector) behind the same selector
shape these call sites already expect — done incrementally, app by app, with the fallback guaranteeing
parity while `@domain/entity-currency-fiat`'s registry is still being onboarded.
