---
"ledger-live-desktop": minor
---

Make the `lldDatadog` feature flag an exclusive (XOR) switch between Datadog and Sentry crash monitoring for A/B testing. When the flag is on, telemetry goes to Datadog (renderer only) and Sentry is muted; when off, Sentry stays on. The flag is resolved only in the renderer, so it is mirrored to the main process over IPC to also mute the main-process Sentry. Both backends remain gated by the user's "Bug reports" opt-in (`sentryLogs`).
