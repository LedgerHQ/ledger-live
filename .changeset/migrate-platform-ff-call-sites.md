---
"ledger-live-desktop": minor
"live-mobile": minor
"@features/platform-feature-flags": minor
---

Migrate feature-flag call sites in LLD + LLM from `@ledgerhq/live-common/featureFlags/*` to `@features/platform-feature-flags`. Pure import-path swap with no behavioral change; OLD providers stay mounted (their removal is LIVE-30413). Adds explicit React import to `FeatureToggle` for Jest classic-runtime compatibility. [LIVE-30412](https://ledgerhq.atlassian.net/browse/LIVE-30412)
