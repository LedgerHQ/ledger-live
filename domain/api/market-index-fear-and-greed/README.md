# @domain/api-market-index-fear-and-greed

> [!CAUTION]
> **Status: UNSTABLE** - Under active development.

Domain API client for the CoinMarketCap **Crypto Fear & Greed Index**, typed on the canonical
`@domain/entity-market-index-fear-and-greed` entity. It adds one endpoint to the shared
CoinMarketCap service api and owns nothing about reaching that backend: no env, config or logging
dependency.

- `schema.ts` - `FearAndGreedResponseSchema`, the Zod schema for the raw CMC
  `/fear-and-greed/latest` wire response.
- `types.ts` - `FearAndGreedResponse`, inferred from that schema.
- `transforms.ts` - `transformFearAndGreedResponse(raw) → FearAndGreedIndex`: validates the wire
  response and maps it to the canonical entity, throwing on an invalid payload.
- `api.ts` - the `fearAndGreedApi` reference, its `FEAR_AND_GREED_TAGS` cache tags and the
  `useGetFearAndGreedLatestQuery` hook.
- `fearAndGreed.mock.ts` - a schema-validated response mock for app MSW handlers, exposed via the
  `./mock` subpath.

## The endpoint is injected, not created

`api.ts` never calls `createApi`. It takes `coinMarketCapApi` from
[`@shared/api-services`](../../../shared/api-services/README.md) and adds to it:

```ts
export const fearAndGreedApi = coinMarketCapApi
  .enhanceEndpoints({ addTagTypes: FEAR_AND_GREED_TAGS })
  .injectEndpoints({
    endpoints: build => ({ getFearAndGreedLatest: build.query(/* … */) }),
  });
```

Both calls mutate and return that same object, so `fearAndGreedApi` **is** `coinMarketCapApi`. This
package therefore has no reducer, no middleware, no `reducerPath` and no `extraArgument` of its own,
and it shares one store slice, one middleware and one cache with every other CoinMarketCap use case.
Only this reference carries the `getFearAndGreedLatest` types.

The query keeps a response for 15 minutes, matching the cadence at which CMC refreshes the index.
That interval is private to `api.ts`.

## Store wiring

Nothing from this package goes into `configureStore`. The app registers the **service** api, which
carries the base URL on its thunk `extraArgument`:

```ts
import { coinMarketCapApi, coinMarketCapApiExtra } from "@shared/api-services";

configureStore({
  reducer: { [coinMarketCapApi.reducerPath]: coinMarketCapApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: coinMarketCapApiExtra({ coinMarketCapApiUrl: getEnv("CMC_API_URL") }),
      },
    }).concat(coinMarketCapApi.middleware),
});
```

Injection is a module-level side effect, so `getFearAndGreedLatest` exists only once this package has
been evaluated as a **value** import. Import `useGetFearAndGreedLatestQuery`, or reach
`fearAndGreedApi.endpoints.*`, from here and never off `coinMarketCapApi`; a type-only import does
not trigger injection either. [`domain/api/`](../README.md) covers the pattern in full.

Fear & Greed UI helpers (level, color and translation-key mapping) live in
`@features/flow-fear-and-greed`.
