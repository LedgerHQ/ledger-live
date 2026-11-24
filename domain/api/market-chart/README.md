# @domain/api-market-chart

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Domain API client for **asset price charts**, typed on the canonical `@domain/entity-market-chart`
entity. It adds two endpoints to the shared Countervalues Service api and owns nothing about reaching
that backend: no env, config or logging dependency.

- `schema.ts` — `MarketChartResponseSchema` and `SupportedChartCounterCurrenciesResponseSchema`, the
  Zod schemas of the raw wire responses.
- `types.ts` — `MarketChartResponse` (inferred from that schema) and `AssetChartDataArgs`.
- `transforms.ts` — the transforms of both endpoints. They validate the wire response, then map it to
  the canonical entity; they throw on an invalid payload.
  - `transformMarketChartResponse(raw, range)` → `MarketCoinDataChart`, keyed by the requested range.
  - `transformSupportedChartCounterCurrencies(raw)` → `string[]`, lowercased.
- `api.ts` — `marketChartApi`, the shared `countervaluesApi` with `MARKET_CHART_TAGS` registered
  through `enhanceEndpoints` and two queries added through `injectEndpoints`:
  - `getAssetChartData` — `/v3/markets/chart/{segment}/{id}`.
  - `getSupportedChartCounterCurrencies` — `/v3/supported/markets/chart/to`.
- `internals/range.ts` — private: maps a UI range to the URL segment. Unknown ranges fall back to one
  day.
- `marketChart.mock.ts` — a schema-validated response mock for app MSW handlers, exposed via the
  `./mock` subpath.

## The endpoints are injected, not created

`api.ts` never calls `createApi`. It takes `countervaluesApi` from
[`@shared/api-services`](../../../shared/api-services/README.md) and adds to it:

```ts
export const marketChartApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: MARKET_CHART_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getAssetChartData: build.query(/* … */),
      getSupportedChartCounterCurrencies: build.query(/* … */),
    }),
  });
```

Both calls mutate and return that same object, so `marketChartApi` **is** `countervaluesApi`. This
package has no reducer, no middleware, no `reducerPath` and no `extraArgument` of its own.

Both endpoints set `maxRetries: 0`: the shared base query retries three times, and these endpoints
never did.

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

Injection is a module-level side effect, so the endpoints exist only once this package has been
evaluated as a **value** import. Import the hooks from here, never off `countervaluesApi`.
