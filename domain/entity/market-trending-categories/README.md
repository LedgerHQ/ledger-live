# @domain/entity-market-trending-categories

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Domain entity for the trending market categories list: the canonical `TrendingCategorySchema` and
`TrendingCategoriesSchema` Zod schemas, and the `TrendingCategory` type inferred from them.

It has no runtime dependency beyond `zod`, and no knowledge of the backend. The api package
[`@domain/api-market-trending-categories`](../../api/market-trending-categories/README.md) validates
the wire response against these schemas.
