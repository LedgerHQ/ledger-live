---
"@features/platform-feature-flags": minor
---

Introduce `@features/platform-feature-flags`: a Redux-backed React hooks layer over `@shared/feature-flags` that exposes `useFeature`, `useFeatureFlags`, `useHasLocallyOverriddenFeatureFlags`, `useWalletFeaturesConfig`, and `FeatureToggle` as a drop-in replacement for the Context-based hooks in `@ledgerhq/live-common/featureFlags`. This is the first package to land under `features/platform/`.
