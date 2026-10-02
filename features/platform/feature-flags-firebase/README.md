# `@features/platform-feature-flags-firebase`

> [!NOTE]
> **Status: STABLE**. Production-ready; API is considered stable.

Maps feature flags to and from Firebase Remote Config. The apps compose it in their Firebase
wiring (`src/firebase/remoteConfig.ts` in `ledger-live-desktop` and `ledger-live-mobile`), so
`@features/platform-feature-flags` stays agnostic of where flag values come from.

No Firebase SDK dependency: Remote Config values are typed structurally through
`RemoteConfigValue`, which both the Firebase JS SDK and `@react-native-firebase` satisfy.

## Exports

| Export                              | Behaviour                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `formatToFirebaseFeatureId(id)`     | Remote Config key for a flag id (`feature_${snake_case(id)}`).                         |
| `formatDefaultFeatures(config)`     | Remote Config defaults map, keyed by Remote Config key, values JSON-stringified.       |
| `parseFirebaseFeatures(all)`        | Known flags from a `getAll()` payload, keeping only values the backend actually sent. |
| `RemoteConfigValue`                 | Structural type of a Remote Config value (`getSource()`, `asString()`).                |
