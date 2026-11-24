# @domain/api-market-performers

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Domain API client for the **market performers** lists, typed on the canonical
`@domain/entity-market-performers` entity. It adds two endpoints to the shared Countervalues Service
api and owns nothing about reaching that backend: no env, config or logging dependency.

- `getMarketPerformers`: the top gainers or losers of a price-change window, from `/v3/markets`.
- `getTrendingPerformers`: the supported trending currencies, from `/v3/currencies/trending`, then their
  markets from `/v3/markets`, kept in the trending order.
- `transforms.ts`: `formatMarketPerformer(item)` maps a raw market item to a performer.
- `schema.ts`: `TrendingCurrenciesResponseSchema`, the wire schema of the trending list.
- `api.ts`: the `marketPerformersApi` reference, its `MARKET_PERFORMERS_TAGS` cache tags and the
  `useGetMarketPerformersQuery` and `useGetTrendingPerformersQuery` hooks.

It reuses the currency api's `getRange` (price-change window segment), `MAX_MARKETS_PAGE_SIZE` and the
`MarketItemResponse` type from `@domain/api-market-currency`.

## The endpoints are injected, not created

`api.ts` never calls `createApi`. It takes `countervaluesApi` from
[`@shared/api-services`](../../../shared/api-services/README.md) and adds to it:

```ts
export const marketPerformersApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: MARKET_PERFORMERS_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getMarketPerformers: build.query(/* … */),
      getTrendingPerformers: build.query(/* … */),
    }),
  });
```

Both endpoints never retry (`maxRetries: 0`), and keep their response for 1 minute, as the legacy
client did.

Injection is a module-level side effect, so the endpoints exist only once this package has been
evaluated as a **value** import. Import the hooks from here, never off `countervaluesApi`.
