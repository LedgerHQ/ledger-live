---
"ledger-live-desktop": minor
---

Migrate LLD feature-flag consumers from `@ledgerhq/live-common/featureFlags` to `@features/platform-feature-flags` (hooks) and `@shared/feature-flags` (actions, selectors, types, constants). Imperative `useFeatureFlags()` destructurings (`overrideFeature`, `resetFeature`, etc.) replaced by Redux dispatch (`setOverride`, `setAllOverrides`). Manager AppsList now uses a local copy of `isAppAssociatedCurrencySupported` that accepts the resolved `Features` map directly. ESLint guardrail added to prevent re-introduction of the migrated names.
