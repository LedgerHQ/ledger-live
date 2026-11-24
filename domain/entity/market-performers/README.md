# @domain/entity-market-performers

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Domain entity for the market performers lists (top gainers, top losers, trending performers): the
canonical `MarketItemPerformerSchema` Zod schema and the `MarketItemPerformer` type inferred from it.

It has no runtime dependency beyond `zod`, and no knowledge of the backend. The api package
[`@domain/api-market-performers`](../../api/market-performers/README.md) maps the raw market items to
this shape.
