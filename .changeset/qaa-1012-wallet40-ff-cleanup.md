---
"ledger-live-mobile-e2e-tests": minor
---

Clean up Wallet 4.0 E2E feature flags: remove the shared `WALLET_40_FEATURE_FLAGS` constant and have each spec rely on the merged e2e defaults, the canonical `FF_LWM_WALLET_40_Q2` preset, or an explicit per-spec flag set. Widen the `featureFlags` init option from `PartialFeatures` to `OptionalFeatureMap`.