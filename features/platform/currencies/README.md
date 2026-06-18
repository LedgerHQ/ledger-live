# @features/platform-currencies

Redux state for currencies, consumed by the apps.

## `supportedFiats` slice

Tracks the list of supported fiats fetched from the Countervalues Service.

The slice itself is **pure**: it only exposes `setSupportedFiats(FiatCurrency[])`. The binding to
`@domain/api-currencies` lives in `data/api.ts`, which enhances the CVS `getSupportedFiats` query
with an `onQueryStarted` that resolves the raw tickers to `@domain/entity-currency-fiat`
`FiatCurrency` entities (OFAC-filtered) and dispatches `setSupportedFiats`. The binding lives in this
feature package rather than in the domain api because the module boundaries forbid `domain → features`.

- `supportedFiatsReducer` — register under `state.supportedFiats` (also the default export).
- `setSupportedFiats` — action to set the resolved `FiatCurrency[]`.
- `selectSupportedFiats` — selector returning the resolved `FiatCurrency[]`.
- `useGetSupportedFiatsQuery` / `supportedFiatsApi` — the enhanced CVS query (use these so the
  `onQueryStarted` binding runs).

This will eventually replace `listSupportedFiats` from `@ledgerhq/live-common`.
