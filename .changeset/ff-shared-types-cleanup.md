---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-dmk-desktop": minor
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
---

Repoint the remaining `@ledgerhq/types-live` feature-type consumers (desktop app + desktop/mobile e2e) onto `@shared/feature-flags`, taking in-repo usage of the legacy types-live feature types to zero. Also drop now-dead feature-flag tooling config: the `@ledgerhq/live-common/featureFlags/index` `unimported` entry in `live-dmk-desktop`, and the deleted `FeatureFlagsContextBridge` eslint-guardrail exemptions in both apps (the block rules against re-introducing the deleted module are kept).
