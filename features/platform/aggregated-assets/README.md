# @features/platform-aggregated-assets

> [!CAUTION]
> **Status: UNSTABLE** — Being migrated out of `live-common`; the API is still being assembled.

App-facing runtime for aggregated assets data. Wraps `@domain/api-aggregated-assets` in React hooks and
owns the cache selectors, asset-discovery helpers and currency-selection logic.

This lives in `features/platform` rather than `features/flow` because several unrelated flows consume
it — Market, Portfolio, Global Search and the asset/network selectors — so it is a capability shared
across flows, not one journey's internals.

## Public API: hooks, plus the pure helpers over what they return

Consumers get the nine hooks and the types they return, and the pure functions that operate on data
a hook already fetched — `selectTopStocks`, `selectTopAssetsByCategory`, `selectCurrency` and
`selectCurrencyForMetaId`. Global Search, the Stocks section and the asset selectors call those
directly rather than through a hook, so exporting them is deliberate.

What stays internal: the RTK Query endpoint objects, the `assetsDataApi` instance, and the cache
selectors in `selectors/` — nothing outside this package imports them.

The one exception is the app composition root, which must register the API's reducer and middleware
in the store.

## `reducerPath` must stay `"assetsDataApi"`

The cache selectors read `state.assetsDataApi?.queries` **by string**. Renaming `reducerPath`
produces **no type error** and silently returns `undefined` for every market and interest-rate
lookup.

## Cache selectors scan every cache entry

`createCurrencyDataSelector` walks RTK Query's internal cache layout:

```text
state.assetsDataApi.queries → entry.data.pages → page[collection][currencyId]
```

Two consequences, both characterized in the test suite and **described, not endorsed**:

- It has no access to the query args of the entries it walks, so a value cached by one query is
  served to callers of any other.
- `pages` is typed `Array<Record<string, unknown>>`, so nothing in this traversal can produce a type
  error. Tests are the only safety net here.

## Status

Populated in `LIVE-35227` from `libs/ledger-live-common/src/dada-client`, which keeps one-line
re-export shims at the old paths until the retarget tasks (`LIVE-35228` / `35229` / `35230`) point
consumers here and `LIVE-35231` deletes them. Tracking epic: `LIVE-35223`.
