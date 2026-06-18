# @domain/api-currencies

Domain API for currencies. RTK Query endpoints and helpers, typed with the
Zod-first entities from `@domain/entity-*`.

## `cvs/` — Countervalues Service

RTK Query evolution of `libs/ledger-live-common/src/currencies/support.ts`.

- `schema.ts` — Zod schema for the `/v3/supported/fiat` response (array of tickers).
- `api.ts` — `cvsApi` (`createApi`) with the `getSupportedFiats` query. The base URL is read from
  the store's thunk `extraArgument`; the app supplies it via `cvsApiExtra(baseUrl)` so this package
  owns no env/config dependency.
- `internals.ts` — OFAC currencies set and filtering (private).
- `utils.ts` — `resolveSupportedFiats(tickers)` → `FiatCurrency[]` (public).

Store wiring (app side):

```ts
configureStore({
  reducer: { [cvsApi.reducerPath]: cvsApi.reducer },
  middleware: gdm =>
    gdm({ thunk: { extraArgument: cvsApiExtra(getEnv("LEDGER_COUNTERVALUES_API")) } })
      .concat(cvsApi.middleware),
});
```

The slice holding the resolved supported fiats lives in `@features/platform-currencies`, which keeps
the slice pure and binds the query result to it via `onQueryStarted` (the domain layer cannot depend
on a feature package per the module boundaries).
