# @domain/api-market-currency

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Domain API client for the **market currency list**, its price lookups and the ledger id lookups,
typed on the canonical `@domain/entity-market-currency` entity. It adds three endpoints to the shared
Countervalues Service api and owns nothing about reaching that backend: no env, config or logging
dependency.

- `api.ts` — `marketCurrencyApi`, the shared `countervaluesApi` with `MARKET_CURRENCY_TAGS` registered
  through `enhanceEndpoints` and three queries added through `injectEndpoints`:
  - `getMarketList` — `/v3/markets`, paginated (`build.infiniteQuery`).
  - `getMarketsByLedgerIds` — `/v3/markets` by `ledgerIds`, in chunks of the largest page size, keeping
    the request order.
  - `getCurrencyData` — `/v3/markets` for one currency, by id or by ledger ids.
- `transforms.ts` — `formatMarketCurrency` and `formatMarketCurrencies`: the raw market item to the
  app-facing `MarketCurrency`.
- `marketList.ts` — `buildMarketListParams` and `getNextMarketListPage`: the query params of one page
  and the pagination rule.
- `sort.ts` — `getSortParam` and `getRange`: the `sort` param of an order over a price-change range.
- `schema.ts` — `MarketItemResponseSchema`, the Zod schema of the raw `/v3/markets` item, its list
  schema `MarketItemListResponseSchema`, and the `MarketItemResponse` type inferred from them.
- `types.ts` — the request params of the lookups.
- `internals/describeSchemaFailure.ts` — turns a rejected response schema into a `CUSTOM_ERROR`.
- `marketItem.mock.ts` — a raw market item mock for app MSW handlers, exposed via the `./mock` subpath.

## The endpoints are injected, not created

`api.ts` never calls `createApi`. It takes `countervaluesApi` from
[`@shared/api-services`](../../../shared/api-services/README.md) and adds to it:

```ts
export const marketCurrencyApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: MARKET_CURRENCY_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getMarketList: build.infiniteQuery(/* … */),
      getMarketsByLedgerIds: build.query(/* … */),
      getCurrencyData: build.query(/* … */),
    }),
  });
```

Both calls mutate and return that same object, so `marketCurrencyApi` **is** `countervaluesApi`. This
package has no reducer, no middleware, no `reducerPath` and no `extraArgument` of its own.

## Runtime validation of `/v3/markets`

The raw item is validated by `MarketItemResponseSchema` before it is transformed. `getMarketList` and
`getCurrencyData` pass the list schema as `rawResponseSchema`, and a rejected body reaches the query's
`error` through `describeSchemaFailure`. `getMarketsByLedgerIds` validates each page: a page whose body
does not match is skipped with the other failed pages, and the error is kept when every page fails.

All three endpoints set `maxRetries: 0`: the shared base query retries three times, and these endpoints
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

Injection is a module-level side effect, so the endpoints exist only once this package has been evaluated
as a **value** import. Import the hooks from here, never off `countervaluesApi`.
