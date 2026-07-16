# @features/flow-fear-and-greed

User-facing Fear & Greed helpers shared across desktop and mobile.

- `utils/fearAndGreed.ts` — maps a Fear & Greed value (0-100) to a `FearAndGreedLevel`, a translation
  key and a color token, plus `isMoodIndexAvailable(region)` for region-based gating.

Pure, presentation-oriented logic (no UI components, no network). The canonical data model lives in
`@domain/entity-market-sentiment` and the RTK Query endpoint in `@domain/api-market-sentiment`.
