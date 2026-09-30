---
"@shared/feature-flags": minor
"@ledgerhq/types-live": minor
---

chore(feature-flags): remove the `firebaseEnvironmentReadOnly` flag

The debug feature flags screens now read the Firebase project from the build config, so nothing
reads this flag anymore. The `feature_firebase_environment_read_only` key can stay in Firebase:
unknown Remote Config keys are ignored when parsing.
