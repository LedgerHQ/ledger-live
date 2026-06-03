---
"live-mobile": minor
---

Fix Firebase remote config keys for FeatureIds whose `snake_case ↔ camelCase` round-trip is lossy via lodash (`llmAccountListUI`, `llmRebornLP`, `web3hub`, `ptxSwapReceiveTRC20WithoutTrx`). `fetchRemoteFlags` now uses a forward `feature_${snakeCase(id)} → FeatureId` lookup built from `FeatureIdSchema.options`, so these flags resolve to their Firebase values instead of silently falling back to defaults.
