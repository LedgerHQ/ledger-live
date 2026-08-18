---
"@shared/feature-flags": minor
---

Add the `lwmPasswordRevamp` feature flag, gating the User App Authentication epic on Ledger Wallet Mobile. Boolean gate with no params, disabled by default; its Remote Config key is derived as `feature_lwm_password_revamp`. Nothing reads it yet.
