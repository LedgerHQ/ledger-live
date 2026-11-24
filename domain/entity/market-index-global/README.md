# @domain/entity-market-index-global

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Domain entity for the **global crypto market index**.

- `schema.ts` — `MarketIndexGlobalSchema` (canonical `{ marketCap, changePercentage24h }`, the change
  already expressed in percent, e.g. `-1.71`).
- `types.ts` — the inferred `MarketIndexGlobal` type.

This is the transformed, app-facing model. The raw countervalues wire-format response schema and the
RTK Query endpoint live in `@domain/api-market-index-global`.
