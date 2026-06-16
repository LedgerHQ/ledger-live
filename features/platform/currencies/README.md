# @features/platform-currencies

Redux state for currencies, consumed by the apps.

## `supportedFiats` slice

Tracks the list of supported fiats fetched from the Countervalues Service. The
slice is populated automatically via `extraReducers` listening to
`cvsApi.endpoints.getSupportedFiats.matchFulfilled` (from `@domain/api-currencies`):
the raw tickers are resolved to `@domain/entity-currency-fiat` `FiatCurrency`
entities and OFAC-filtered.

- `supportedFiatsReducer` — register under `state.supportedFiats` (also the default export).
- `selectSupportedFiats` — selector returning the resolved `FiatCurrency[]`.

This will eventually replace `listSupportedFiats` from `@ledgerhq/live-common`.
