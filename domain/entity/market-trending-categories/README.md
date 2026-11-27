# @domain/entity-market-trending-categories

> [!CAUTION]
> **Status: UNSTABLE**. Migrating out of `@ledgerhq/live-common`, API may change.

Entity of a Market trending category, a `{ id, name }` pair shown as a category chip on the Market screen.

## Exports

- `MarketTrendingCategorySchema`, `MarketTrendingCategoriesSchema`: Zod schemas of one category and of the list the Countervalues Service returns.
- `MarketTrendingCategory`: type inferred from the schema.

Consumed by `@domain/api-market-trending-categories`.
