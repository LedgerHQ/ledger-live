# @domain/entity-market-sentiment

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Domain entity for **market sentiment**, backed by the CoinMarketCap Crypto Fear & Greed index.

- `schema.ts` — `FearAndGreedIndexSchema` (canonical `{ value, classification }`).
- `types.ts` — the inferred `FearAndGreedIndex` type.

This is the transformed, app-facing model. The raw CoinMarketCap wire-format response schema and the
RTK Query endpoint live in `@domain/api-market-sentiment`; the Fear & Greed UI helpers (level, color
and translation-key mapping) live in `@features/flow-fear-and-greed`.
