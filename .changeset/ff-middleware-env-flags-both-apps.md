---
"ledger-live-desktop": minor
"live-mobile": minor
---

Wire `getEnv("FEATURE_FLAGS")` into `createFeatureFlagsMiddleware`'s `resolutionConfig.envFlags` so env-injected feature flag overrides reach Redux-backed consumers (parity with live-common's Context behavior). Unblocks the LWD and LLM migrations whose Playwright/Detox env-injection paths went silent after the slice became the source of truth.
