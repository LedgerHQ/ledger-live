---
"ledger-live-desktop": minor
---

Repoint the live-common FeatureFlags Context bridge to read feature-flag values from the Redux slice (`@shared/feature-flags`), gate app boot on the `remoteFlagsReady` selector, and remove the Firebase remote-config provider. The `LiveConfig` provider install + dev-only config-mismatch check move to `firebase/remoteConfig.ts` (installed once at renderer bootstrap), and `AppVersionBlocker` re-reads `config_ll_min_version` via `subscribeToRemoteFlags`. The Context bridge stays mounted (renamed `FeatureFlagsContextBridge`) until live-common's internal hooks migrate off the Context. No user-facing behaviour change.
