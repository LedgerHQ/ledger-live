# @domain/entity-market-chart

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Domain entity for market price charts: `[timestamp, value]` points, the chart range, and the
Countervalues chart response.

- `schema.ts` — `MarketChartRangeSchema` (local range type), `ChartDataPointSchema`,
  `MarketChartApiResponseSchema`, `MarketCoinDataChartSchema` (points keyed by range).
- `types.ts` — the inferred types.
- `schema.mock.ts` — mocks, exported as `@domain/entity-market-chart/schema.mock`.
