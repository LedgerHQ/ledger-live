---
"@ledgerhq/types-live": minor
"@ledgerhq/live-common": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Persist onboardingDate in the shared post-onboarding store to power the post-onboarding upsell cooldown. It is preserved when reopening or hiding the wallet entry point for the same device, refreshed when a different device is onboarded, and backfilled to today once for legacy users on first launch.
