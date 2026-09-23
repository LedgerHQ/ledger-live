# @domain/api-market-countervalues

> [!CAUTION]
> **Status: UNSTABLE** — Being migrated out of `@ledgerhq/live-countervalues`; API may change.

Domain API client for **countervalues**: how rates are fetched, and the orchestration that folds
them into the state `@domain/entity-market-countervalues` owns.

The entity package knows the shape of the rates and every computation over them. This package knows
the Countervalues Service and nothing else: no React, no store, no persistence.

## Endpoints

There is no `createApi` here. The endpoints are injected into the shared Countervalues Service api
from `@shared/api-services`, so they share its reducer, middleware and cache, and the apps register
one countervalues slice rather than two.

| endpoint | path |
| --- | --- |
| `getHistoricalRates` | `/v3/historical/{granularity}/simple` |
| `getSpotRates` | `/v3/spot/simple` |
| `getCounterValueIdsSortedByMarketCap` | `/v3/supported/crypto` |
| `getUsdToFiatRate` | `/v3/spot/simple` |

The base URL arrives through the app's existing `cvsApiExtra` on the thunk `extraArgument`, so this
package owns no configuration.

The two rate endpoints set `keepUnusedDataFor: 0`. The countervalues rate store *is* the cache,
one merged time series per pair, continuously extended, and a second RTK-keyed cache beside it
would be a second source of truth for the same rates.

They also override the shared base query's retry. See `internals/retry.ts`: the policy mirrors what
`@ledgerhq/live-network` did for these calls, because the per-pair backoff in `loadCountervalues`
has always counted one logical failure on top of a retry layer.

## `RateSource`

`loadCountervalues` takes its rates as an argument. It cannot be an RTK Query endpoint under any
design: its cache key would be the whole prior state, and its result holds `Map` instances, which
is what `serializableCheck` exists to reject.

```ts
const rates = createRateSource({
  fetchHistoricalWindow: args =>
    dispatch(marketCountervaluesApi.endpoints.getHistoricalRates.initiate(args, { forceRefetch: true })),
  fetchSpotBatch: args =>
    dispatch(marketCountervaluesApi.endpoints.getSpotRates.initiate(args, { forceRefetch: true })),
});

const next = await loadCountervalues(state, settings, { rates, log });
```

`createRateSource` owns the windowing, the API-id resolution, the chunking of pairs into spot
batches and the bounded concurrency, so a caller supplies only the two dispatches. It holds no
state, no dispatch and no store reference.

Apps build one at composition time and hand it over; nothing here reaches for a store.

## Error handling

Failures reject as `RateFetchError`, carrying RTK Query's `status` **verbatim**. Three behaviours
depend on that and are easy to lose when moving between HTTP layers:

- a **422** on an unsupported pair wipes that pair's cache
- an **HTTP failure** increments the per-pair backoff in `status`
- **network down** does not count as a failure, or every offline period poisons the backoff

The envelope already draws that line: an HTTP response gives a numeric status, a dead connection
gives `"FETCH_ERROR"`. Mapping these into a coarser taxonomy would silently lose the first two, so
nothing is mapped.

## `./mock`

`createMockRateSource(seed?)` is a deterministic `RateSource` over the reference table in
`@domain/entity-market-countervalues/mock`. It performs no I/O and reads no environment.

Tests pass it directly. There is no `MOCK_COUNTERVALUES` switch inside this package: an app that
wants mocked rates chooses one at composition time, where the choice is visible.
