---
"@features/platform-feature-flags-firebase": minor
"@features/platform-feature-flags": minor
"@features/platform-content-ab-tests": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

`@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.
