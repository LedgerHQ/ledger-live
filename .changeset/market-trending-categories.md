---
"@ledgerhq/live-common": minor
"live-mobile": minor
---

Add trending categories to the Market screen. Trending categories are fetched from `/v3/categories/trending` and appended to the category controls (after All / Stocks / Favorites); selecting one filters the asset list via the `/v3/markets` `categories` param.

Shared logic lives in `@ledgerhq/live-common/market` so desktop can reuse it: the `getTrendingCategories` RTK Query endpoint (`useGetTrendingCategoriesQuery`), the `categories` request param threaded through `fetchList`/`useMarketData`, and category helpers (widened `MarketListCategory`, `isBuiltInMarketListCategory`, `getMarketCategoriesParam`).
