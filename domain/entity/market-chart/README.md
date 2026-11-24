# @domain/entity-market-chart

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Domain entity for **asset price charts**.

- `schema.ts` — `ChartDataPointSchema` (one `[timestamp, price]` sample) and
  `MarketCoinDataChartSchema` (a series keyed by range, e.g. `{ "24h": [[ts, price], ...] }`).
- `types.ts` — the inferred `ChartDataPoint` and `MarketCoinDataChart` types, and the
  `MARKET_CHART_RANGES` list with its `MarketChartRange` type.

This is the transformed, app-facing model. The raw countervalues wire-format response schemas and the
RTK Query endpoints live in `@domain/api-market-chart`.
