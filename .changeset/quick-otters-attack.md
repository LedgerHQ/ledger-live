---
"@ledgerhq/types-live": minor
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
"@features/platform-feature-flags": patch
"live-mobile": patch
---

Extract `quickActionsCtasVariant` out of the `feature_lwm_wallet_40` feature flag into a dedicated `feature_lwm_quick_actions_ctas_variant` flag so the A/B test can run independently from other Wallet 4.0 parameters
