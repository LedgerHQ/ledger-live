---
"live-mobile": minor
---

Repoint the live-common FeatureFlags Context bridge to read feature-flag values from the Redux slice (`@shared/feature-flags`), gate app boot on the `remoteFlagsReady` selector, and remove the now-redundant app-side Firebase RTK Query fetch layer (`useFirebaseRemoteConfig`, `firebaseRemoteConfigApi`). The `LiveConfig` provider install moves to `firebase/remoteConfig.ts` so `config_*` keys stay populated. No user-facing behaviour change.
