# @domain/entity-altcoins-sentiment

Domain entity for **altcoins sentiment**, backed by the CoinMarketCap Altcoin Season Index.

- `schema.ts` — `AltcoinSeasonIndexSchema` (canonical `{ value, altcoinMarketcap }`).
- `types.ts` — the inferred `AltcoinSeasonIndex` type.

This is the transformed, app-facing model. The raw CoinMarketCap wire-format response schema and the
RTK Query endpoint live in `@domain/api-altcoins-sentiment`.
