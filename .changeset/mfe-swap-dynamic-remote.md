---
"@shared/mobile-host-runtime": minor
"live-mobile": minor
"@shared/feature-flags": minor
---

feat(mfe): dynamic runtime URL for the `swap` Module Federation remote

Adds RN-native Module Federation host helpers (`createRemoteComponent`, `RemoteErrorBoundary`)
to `@shared/mobile-host-runtime`, resolves the `swap` remote's manifest URL at runtime
(local dev server when reachable, otherwise the production URL from the new `ptxSwapMfe`
feature flag), and gracefully renders nothing when no remote is available.
