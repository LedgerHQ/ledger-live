# @domain/api-market-index-global

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Domain API client for the **global crypto market index**, typed on the canonical
`@domain/entity-market-index-global` entity. It adds one endpoint to the shared Countervalues Service
api and owns nothing about reaching that backend: no env, config or logging dependency.

- `schema.ts` — `GlobalMarketDataResponseSchema`, the Zod schema for the raw `/v3/markets/global`
  wire response.
- `types.ts` — `GlobalMarketDataResponse` (inferred from that schema) and `GlobalMarketDataArgs`.
- `transforms.ts` — `transformGlobalMarketDataResponse(raw) → MarketIndexGlobal`: validates the wire
  response and maps it to the canonical entity, converting the 1d ratio to a percentage. Throws on an
  invalid payload.
- `api.ts` — the `marketIndexGlobalApi` reference, its `MARKET_INDEX_GLOBAL_TAGS` cache tags and the
  `useGetGlobalMarketDataQuery` hook.
- `globalMarketData.mock.ts` — a schema-validated response mock for app MSW handlers, exposed via the
  `./mock` subpath.

## The endpoint is injected, not created

`api.ts` never calls `createApi`. It takes `countervaluesApi` from
[`@shared/api-services`](../../../shared/api-services/README.md) and adds to it:

```ts
export const marketIndexGlobalApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: MARKET_INDEX_GLOBAL_TAGS })
  .injectEndpoints({
    endpoints: build => ({ getGlobalMarketData: build.query(/* … */) }),
  });
```

Both calls mutate and return that same object, so `marketIndexGlobalApi` **is** `countervaluesApi`.
This package has no reducer, no middleware, no `reducerPath` and no `extraArgument` of its own.

The endpoint never retries (`maxRetries: 0`): the shared base query retries three times, and this
endpoint did not. The query keeps a response for 3 minutes, as the legacy client did.

## Store wiring

Nothing from this package goes into `configureStore`. The app registers the **service** api, which
carries the base URL on its thunk `extraArgument`:

```ts
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";

configureStore({
  reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: cvsApiExtra({ getCountervaluesServiceUrl: () => getEnv("CVS_API_URL") }),
      },
    }).concat(countervaluesApi.middleware),
});
```

Injection is a module-level side effect, so `getGlobalMarketData` exists only once this package has been
evaluated as a **value** import. Import `useGetGlobalMarketDataQuery` from here, never off
`countervaluesApi`.
