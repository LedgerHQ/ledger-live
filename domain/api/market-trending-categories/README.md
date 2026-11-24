# @domain/api-market-trending-categories

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Domain API client for the **trending market categories** list, typed on the canonical
`@domain/entity-market-trending-categories` entity. It adds one endpoint to the shared Countervalues
Service api and owns nothing about reaching that backend: no env, config or logging dependency.

- `transforms.ts`: `transformTrendingCategoriesResponse(raw)` validates the wire response and keeps the
  first `MAX_TRENDING_CATEGORIES` (5) categories, in the order the backend returns them. Throws on an
  invalid payload.
- `api.ts`: the `trendingCategoriesApi` reference, its `TRENDING_CATEGORIES_TAGS` cache tags and the
  `useGetTrendingCategoriesQuery` hook.
- `trendingCategories.mock.ts`: a schema-validated response mock, exposed via the `./mock` subpath.

## The endpoint is injected, not created

`api.ts` never calls `createApi`. It takes `countervaluesApi` from
[`@shared/api-services`](../../../shared/api-services/README.md) and adds to it:

```ts
export const trendingCategoriesApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: TRENDING_CATEGORIES_TAGS })
  .injectEndpoints({
    endpoints: build => ({ getTrendingCategories: build.query(/* … */) }),
  });
```

The endpoint never retries (`maxRetries: 0`): the shared base query retries three times, and this
endpoint did not. The query keeps a response for 3 minutes, as the legacy client did.

Injection is a module-level side effect, so `getTrendingCategories` exists only once this package has
been evaluated as a **value** import. Import `useGetTrendingCategoriesQuery` from here, never off
`countervaluesApi`.
