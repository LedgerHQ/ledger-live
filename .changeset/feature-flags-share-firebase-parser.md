---
"@features/platform-feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

refactor(feature-flags): share the Firebase Remote Config parser between apps

Both apps carried their own copy of the Firebase-key-to-FeatureId map and the loop that filters
and JSON-parses a `getAll()` payload. `parseFirebaseFeatures` now lives in
`@features/platform-feature-flags/firebase`, next to `formatToFirebaseFeatureId`, of which its
key map is the exact inverse.

It takes a structural `RemoteConfigValue` (`getSource()` + `asString()`), satisfied by both the
Firebase JS SDK and `@react-native-firebase`, so the package gains no SDK dependency. Reading the
SDK stays per-app, where the two platforms are deliberately asymmetric.
