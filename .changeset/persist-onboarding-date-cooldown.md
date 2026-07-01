---
"@ledgerhq/types-live": minor
"@ledgerhq/live-common": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Persist onboardingDate in the shared post-onboarding store to power the post-onboarding upsell cooldown. It is set on onboarding completion, preserved when hiding the wallet entry point, and backfilled to today once for legacy users on first launch (existing dates are never overwritten).
