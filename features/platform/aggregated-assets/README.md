# @features/platform-aggregated-assets

> [!CAUTION]
> **Status: UNSTABLE** — Being migrated out of `live-common`; the API is still being assembled.

App-facing runtime for aggregated assets data. Wraps `@domain/api-aggregated-assets` in React hooks and
owns the cache selectors, asset-discovery helpers and currency-selection logic.

This lives in `features/platform` rather than `features/flow` because several unrelated flows consume
it — Market, Portfolio, Global Search and the asset/network selectors — so it is a capability shared
across flows, not one journey's internals.

## Public API is hooks-only

Consumers get hooks plus the types those hooks return. The RTK Query endpoint objects, the cache
selectors and the `assetsDataApi` instance stay internal.

The one exception is the app composition root, which must register the API's reducer and middleware
in the store.

## `reducerPath` must stay `"assetsDataApi"`

The cache selectors read `state.assetsDataApi?.queries` **by string**, and Storybook stories preload
that same key directly. Renaming `reducerPath` produces **no type error** and silently returns
`undefined` for every market and interest-rate lookup.

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

Scaffolded and empty. Code arrives from `libs/ledger-live-common/src/dada-client` in `LIVE-35227`.
Tracking epic: `LIVE-35223`.
