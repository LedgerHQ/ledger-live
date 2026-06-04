---
"live-mobile": patch
---

Upgrade Datadog React Native SDK to 3.5.2 (`@datadog/mobile-react-native` and `@datadog/mobile-react-navigation`). The v3 configuration is restructured into nested `rumConfiguration` / `logsConfiguration` / `traceConfiguration` objects; the remote `llmDatadog` feature-flag params (kept in the flat v2 shape) are remapped to the v3 shape at initialization, and `startTrackingViews` now takes a `{ viewNamePredicate }` options object.
