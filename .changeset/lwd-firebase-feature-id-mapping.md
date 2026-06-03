---
"ledger-live-desktop": minor
---

Fix Firebase remote config keys for FeatureIds whose `snake_case ↔ camelCase` round-trip is lossy via lodash (`web3hub`, `ptxSwapReceiveTRC20WithoutTrx`, `llmAccountListUI`, `llmRebornLP`). `fetchRemoteFlags` now uses a forward `feature_${snakeCase(id)} → FeatureId` lookup built from `FeatureIdSchema.options`, and matches Firebase keys case-insensitively. No LWD-side flag currently consumes the affected names, but the bug was structurally present and would silently drop any future `lld*`/`lwd*` flag ending in ≥2 consecutive uppercase letters or containing digits.
