# @domain/api-market-trending-categories

> [!CAUTION]
> **Status: UNSTABLE**. Migrating out of `@ledgerhq/live-common`, API may change.

RTK Query endpoint for the Market trending categories, injected into the shared Countervalues Service api (`countervaluesApi` from `@shared/api-services`).

## Endpoint

- `getTrendingCategories`: `GET /v3/categories/trending`. The response is validated against `MarketTrendingCategoriesSchema` from `@domain/entity-market-trending-categories`, then cut to the first 5 categories. No retry, cached 3 minutes after the last subscriber leaves, tagged `TrendingCategories`.
- A response that fails the schema surfaces as a `CUSTOM_ERROR` query error naming the rejected paths.

## Exports

- `marketTrendingCategoriesApi`, `MarketTrendingCategoriesApi`
- `useGetTrendingCategoriesQuery`

## Store wiring

The endpoint shares the `countervaluesApi` reducer and middleware, so a store that already registers the Countervalues Service api needs no extra wiring beyond importing this package.
