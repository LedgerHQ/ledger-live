# @domain/api-swap-quotes

> [!CAUTION]
> **Status: UNSTABLE** — Being migrated out of `live-common`; API may change.

Domain API client for the swap quotes aggregator. Owns the `/quote` request: how
it is built, how it is authenticated, and how the raw payload is split into
usable quotes and per-provider rejections.

## Scope

This package is the network boundary only. It does not know about accounts,
currencies or the wallet store — everything it needs arrives in
`FetchQuotesQueryArgs`, with wallet-side lookups already resolved into
`ResolvedQuotesInput`. Normalising, formatting, sorting and error digestion of
quotes stay with the caller.

## Main exports

- `swapQuotesApi` — RTK Query API with a single `fetchQuotes` query. Register it
  in the app's `rtkQueryApi.ts` so its reducer and middleware are wired up.
- `buildQuotesParams`, `splitQuotes`, `transformFetchQuotesResponse` — the pure
  pieces of the request/response mapping, exported for testing and reuse.
- The `Raw*` payload types plus `FetchQuotesResult` and `ResolvedQuotesInput`.

## Usage

The endpoint is consumed imperatively rather than through a hook, because the
swap `getQuotes` flow runs server-side in the wallet-api handler:

```ts
const promise = dispatch(
  swapQuotesApi.endpoints.fetchQuotes.initiate(args, { forceRefetch: true }),
);
try {
  const result = await promise;
  // ...
} finally {
  promise.unsubscribe();
}
```

Do not pass `subscribe: false`: without a subscriber, `keepUnusedDataFor: 0` can
evict the cache entry before the promise resolves and the result reads back
empty.

## Authentication

The base query is `createAuthenticatedBaseQuery` from `@shared/auth`. Whether a
request carries an `Authorization` header depends on the `lwdAuth`/`lwmAuth`
feature flags, which are off by default. HTTP status errors are deliberately
left as RTK Query errors so the adapter's 401/403 refresh-and-retry can fire;
mapping them to a caller-facing outcome is the caller's job.

## Migration note

`@ledgerhq/wallet-api-exchange-module` is a published package supplying the
wallet-api wire contract (`QuotesInput`, `ProviderErrorCodes`). It is the one
`@ledgerhq/*` dependency here, and it is type-only apart from the
`ProviderErrorCodes` enum. Pending confirmation that the DDD layers may depend
on published packages as ordinary npm dependencies.
