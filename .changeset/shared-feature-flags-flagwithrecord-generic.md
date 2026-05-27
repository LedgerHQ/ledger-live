---
"@shared/feature-flags": minor
---

Tighten `flagWithRecord` so `Features[K].params` infers the record's value type instead of collapsing to `unknown`. Consumers indexing into a `flagWithRecord`-backed flag (e.g. `receiveStakingFlowConfigDesktop.params[currencyId]`) now get the proper schema-derived type without needing a cast.
