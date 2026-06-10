---
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
"@features/platform-feature-flags": minor
"@ledgerhq/live-dmk-desktop": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Migrate `@ledgerhq/live-common`'s internal feature-flag consumers off its React `featureFlags` Context module and `@ledgerhq/types-live` feature types, onto the Redux-backed `@shared/feature-flags` / `@features/platform-feature-flags` packages, and remove the `featureFlags` module along with the apps' now-inert `FeatureFlagsContextBridge`. Remaining external React consumers (both apps) are repointed to `@features/platform-feature-flags`; `@ledgerhq/live-dmk-desktop` receives its `ldmkTransport` flag via a prop instead of depending on the feature-flags package; non-React imperative reads use an injected getter or the relocated `live-common/firebase/featureFlags` reader. Adds the platform-specific `formatToFirebaseFeatureId` / `formatDefaultFeatures` to `@features/platform-feature-flags` and the generic `isValidFeatureId` to `@shared/feature-flags`. No behavioral change — resolved flag values are identical.
