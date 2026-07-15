---
"@shared/feature-flags": minor
"@ledgerhq/types-live": minor
"ledger-live-desktop": minor
---

Remove the always-enabled `nanoOnboardingFundWallet` feature flag and clean up the dead onboarding tutorial code it gated (the `Aside` illustration sidebar, per-screen `Illustration`/`Footer` statics, related shared helpers, and orphaned i18n keys).
