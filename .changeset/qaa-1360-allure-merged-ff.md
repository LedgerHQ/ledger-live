---
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
---

E2E Allure report overview now reflects the feature flags actually applied at runtime (e2e defaults + workflow `E2E_FEATURE_FLAGS_JSON` overrides, with JSON taking precedence), instead of Firebase-only values. FF resolution is centralised per platform via a shared `getMergedFeatureFlags()` used by both the test setup and the report teardown, so the overview and per-test data share one source of truth.
